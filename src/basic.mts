
interface VariableReference {
    variable: string;
}

interface LineReference {
    lineOffset: number;
}

interface LabelReference {
    label: string;
}

interface JumpTableIndex {
    isDefinition: false;
    jumpTable: string;
    label: string;
}

interface JumpTableDefinition {
    isDefinition: true;
    jumpTable: string;
}

interface LabelDefinition {
    definedLabel: string;
    isSubroutine: boolean;
}

type BasicLinePart = string | VariableReference | LineReference | LabelReference | JumpTableDefinition | JumpTableIndex;
type BasicLine = BasicLinePart[];

type BasicLineIngredient = BasicLinePart | LabelDefinition;
type BasicProgramIngredient = (BasicLineIngredient[] | BasicProgramIngredient)[]

type VariableType = "integer" | "string" | "float" | "loop" | "intarray";

interface VariableInfo {
    type: "unknown" | VariableType;
    name: string,
}

class VariableNamer {
    private readonly ordinals = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ];
    private readonly alphabet = [
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
        "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
        "U", "V", "W", "X", "Y", "Z"
    ];
    private named = new Map<string, string>();
    private usedPrefixes = new Set<string>();
    private suffixes: Record<VariableType, string> = {
        "string": "$",
        integer: "%",
        intarray: "%",
        float: "",
        loop: "",
    };

    constructor() {}

    getName(info: VariableInfo) {
        const existingName = this.named.get(info.name);
        if (existingName) return existingName;
        if (info.type == "unknown") throw new Error(`Type of variable ${info.name} is unknown`);

        let coreName = info.name.toUpperCase();
        const replacePairs = [
            ["AT", "T"],
            ["AND", "ND"],
            ["END", "ND"],
            ["ON", "N"],
            ["OR", "R"],
            ["GR", "G"],
            ["INPUT", "INPT"],
            ["LEN", "LN"],
            ["LET", "LT"],
            ["LOAD", "LOD"],
            ["MOD", "MD"],
            ["NEXT", "NXT"],
            ["POS", "PS"],
            ["READ", "RED"],
            ["RND", "RD"],
            ["WAIT", "WT"],
        ] as const;
        for (const pair of replacePairs) {
            coreName = coreName.replaceAll(pair[0], pair[1]);
        }

        let name: string;
        let prefix = coreName.substring(0, 2);
        if (!this.usedPrefixes.has(prefix)) {
            this.usedPrefixes.add(prefix);
            name = coreName + this.suffixes[info.type];
        } else {
            let letter = coreName.substring(0, 1);
            let ordinalIndex = 0;
            let prefix: string;
            while (true) {
                prefix = letter + this.ordinals[ordinalIndex];
                if (!this.usedPrefixes.has(prefix)) break;
                if (ordinalIndex + 1 < this.ordinals.length) {
                    ordinalIndex++;
                } else {
                    ordinalIndex = 0;
                    letter = this.alphabet[this.alphabet.indexOf(letter) % this.alphabet.length]!;
                }
            }
            this.usedPrefixes.add(prefix);
            name = prefix + coreName + this.suffixes[info.type];
        }
        this.named.set(info.name, name);
        return name;
    }
}

class BasicProgramBuilder {
    private labels = new Map<string, number>();
    private variables = new Map<string, VariableInfo>();
    private program: BasicProgramIngredient = [];
    private jumpTables = new Map<string, string[]>();

    private constructor() {}

    static builder(): BasicProgramBuilder {
        return new BasicProgramBuilder();
    }

    add(...program: BasicProgramIngredient) {
        this.program.push(...program);
    }

    private flatten(program: BasicProgramIngredient) {
        const lineIngredients: BasicLineIngredient[][] = [];
        const remaining = [...program];
        while (remaining.length > 0) {
            const block = remaining.shift()!;
            if (Array.isArray(block[0])) {
                remaining.unshift(...(block as BasicLineIngredient[][]));
            } else {
                lineIngredients.push(block as BasicLineIngredient[]);
            }
        }
        return lineIngredients;
    }

    private validateAndFlatten(program: BasicProgramIngredient) {
        const programLines = this.flatten(program);
        const lines: BasicLine[] = [];
        for (const line of programLines) {
            const lineIndex = lines.length;
            lines.push(line.map(i => {
                if (i === undefined) throw new Error(`undefined element in line: ${line}`);
                if (typeof i != "string" && "definedLabel" in i) {
                    if (this.labels.has(i.definedLabel)) {
                        throw new Error(`The label ${i.definedLabel} has already been used`);
                    }
                    this.labels.set(i.definedLabel, lineIndex);
                    return `REM ${i.isSubroutine ? "SUBROUTINE" : "LABEL"} ${i.definedLabel.toUpperCase()}`;
                } else {
                    return i;
                }
            }));
        }
        return lines;
    }

    private resolveVariable(variable: string) {
        const resolved = this.variables.get(variable);
        if (resolved == undefined) throw new Error(`Unknown variable ${variable}`);
        return resolved;
    }

    private resolveLabel(label: string) {
        const resolved = this.labels.get(label);
        if (resolved == undefined) throw new Error(`Unknown label ${label}`);
        return resolved;
    }

    output(): string {
        const lines = this.validateAndFlatten(this.program);
        const indexToLine = (i: number) => (i + 1)*10;
        const variableNamer = new VariableNamer();
        let output = "";
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            output += `${indexToLine(i)} `;
            for (let part of line) {
                if (typeof part == "string") {
                    output += part;
                } else if ("isDefinition" in part) {
                    const jumpTable = this.jumpTables.get(part.jumpTable);
                    if (jumpTable == undefined) throw new Error(`Unknown jump table ${part.jumpTable}`);
                    if (part.isDefinition) {
                        const variableName = variableNamer.getName(this.resolveVariable(part.jumpTable))
                        output += `ON ${variableName} GOTO ${jumpTable.map(l => indexToLine(this.resolveLabel(l))).join(", ")}`
                    } else {
                        const labelIndex = jumpTable.indexOf(part.label);
                        if (labelIndex < 0) throw new Error(`Unknown label ${part.label} in ${part.jumpTable}`);
                        output += `${labelIndex + 1}`;
                    }
                } else if ("variable" in part) {
                    output += variableNamer.getName(this.resolveVariable(part.variable));
                } else if ("label" in part) {
                    output += indexToLine(this.resolveLabel(part.label));
                } else {
                    output += indexToLine(part.lineOffset + i + 1);
                }
            }
            output += "\n";
        }
        return output;
    }

    makeIf(test: string | BasicLineIngredient[], body: BasicProgramIngredient): BasicProgramIngredient {
        const blockContent = this.flatten(body);
        return [
            ["IF ", ...(typeof test == "string" ? [test] : test), " GOTO ", this.lineRef(1)],
            ["GOTO ", this.lineRef(blockContent.length)],
            ...blockContent,
        ];
    }
    
    makeIfElse(test: string | BasicLineIngredient[], ifBody: BasicProgramIngredient, elseBody: BasicProgramIngredient): BasicProgramIngredient {
        const ifBlockContent = this.flatten(ifBody);
        const elseBlockContent = this.flatten(elseBody);
        return [
            ["IF ", ...(typeof test == "string" ? [test] : test), " GOTO ", this.lineRef(elseBlockContent.length + 1)],
            ...elseBlockContent,
            ["GOTO ", this.lineRef(ifBlockContent.length)],
            ...ifBlockContent,
        ];
    }

    makeFor(loopVarName: string, start: string | BasicLineIngredient[], end: string | BasicLineIngredient[], body: BasicProgramIngredient): BasicProgramIngredient {
        return [
            [
                "FOR ",
                this.variableReference(loopVarName, "loop"),
                " = ",           
                ...(typeof start == "string" ? [start] : start),
                " TO ",
                ...(typeof end == "string" ? [end] : end),
            ],    
            body,
            ["NEXT ", this.variableReference(loopVarName, "loop")],
        ];
    }

    makeSubroutine(name: string, body: BasicProgramIngredient): BasicProgramIngredient {
        const content = this.flatten(body);
        return [
            ["GOTO ", this.lineRef(content.length + 2)],
            [this.declareSubroutine(name)],
            content,
            ["RETURN"]
        ];
    }

    private asData(data: number[]): BasicProgramIngredient {
        const program: BasicProgramIngredient = [];
        let current = "";
        for (const datum of data) {
            const item = `${datum}`;
            if ((current.length + item.length + 2) >= (239 - 10)) {
                program.push(["DATA " + current]);
                current = "";
            }
            if (current.length > 0) {
                current += ", ";
            }
            current += item;
        }
        program.push(["DATA " + current]);
        return program;
    }

    declareAndInitializeArray(name: string, data: number[]): BasicProgramIngredient {
        this.recordVariable(name, "intarray");
        const dimensions = [data.length];
        return [
            [this.t`DIM ${name}(${data.length})`],
            this.makeFor("load", "0", `${dimensions[0]! - 1}`, [
                [this.t`READ ${name}(${"load"})`]
            ]),
            this.asData(data),
        ];
    }

    declareAndInitialize2dArray(name: string, data: number[][]): BasicProgramIngredient {
        const dimensions = [data.length, data[0]!.length] as const;
        return [
            [`DIM ${name}%(${dimensions.map(d => d - 1).join(", ")})`],
            this.makeFor("load", "0", `${dimensions[0]! - 1}`, 
                [...Array(dimensions[1]!).keys()].map(i => [`READ ${name}%(`, this.v("load"), `, ${i})`])
            ),
            this.asData(data.flatMap(a => a)),
        ];
    }

    private recordVariable(name: string, type?: VariableType) {
        const info = this.variables.get(name);
        if (info) {
            if (type) {
                if (info.type == "unknown") {
                    info.type = type;
                } else if (info.type != type) {
                    throw new Error(`Inconsistent type for variable ${name}: ${info.type}, ${type}`);
                }
            }
        } else {
            this.variables.set(name, {
                name,
                type: type ?? "unknown",
            });
        }
    }

    declareLabel(name: string) {
        return { definedLabel: name, isSubroutine: false };
    }

    private declareSubroutine(name: string) {
        return { definedLabel: name, isSubroutine: true };
    }

    lineRef(lineOffset: number) {
        return { lineOffset: lineOffset < 0 ? lineOffset - 1 : lineOffset };
    }

    labelRef(name: string): LabelReference {
        return { label: name };
    }

    subroutineRef(name: string): LabelReference {
        return { label: name };
    }

    sub(name: string): LabelReference {
        return this.subroutineRef(name);
    }

    callSubroutine(name: string): BasicLineIngredient[] {
        return ["GOSUB ", this.subroutineRef(name)];
    }

    gotoLabel(name: string): BasicLineIngredient[] {
        return ["GOTO ", this.labelRef(name)];
    }

    variableReference(name: string, type?: VariableType) {
        this.recordVariable(name, type);
        return { variable: name };
    }

    mod(value: string | BasicLineIngredient[], divisor: string | BasicLineIngredient[]): BasicLineIngredient[] {
        const renderedValue = typeof value == "string" ? [value] : value;
        const renderedDivisor = typeof divisor == "string" ? [divisor] : divisor;

        return [
            "(",
            ...renderedValue,
            ") - (",
            ...renderedDivisor,
            ") * INT((",
            ...renderedValue,
            ") / (",
            ...renderedDivisor,
            "))",
        ];
    }

    vi(name: string) {
        return this.variableReference(name, "integer");
    }

    vs(name: string) {
        return this.variableReference(name, "string");
    }

    v(name: string) {
        return this.variableReference(name);
    }

    template(strings: TemplateStringsArray, ...args: (number | BasicLineIngredient | BasicLineIngredient[])[]): BasicLineIngredient[] {
        const ingredients: BasicLineIngredient[] = [...strings];
        for (let i = args.length - 1; i >= 0; i--) {
            const arg = args[i]!;
            let argIngredients: BasicLineIngredient[];
            if (typeof arg == "string") {
                argIngredients = [this.v(arg)];
            } else if (typeof arg == "number") {
                argIngredients = [`${arg}`];
            } else if (Array.isArray(arg)) {
                argIngredients = arg;
            } else {
                argIngredients = [arg];
            }
            ingredients.splice(i + 1, 0, ...argIngredients);
        }
        return ingredients;
    }

    t(strings: TemplateStringsArray, ...args: (number | BasicLineIngredient | BasicLineIngredient[])[]): BasicLineIngredient[] {
        return this.template(strings, ...args);
    }

    setJump(jumpTable: string, label: string): BasicLineIngredient[] {
        let jumpTableLabels = this.jumpTables.get(jumpTable);
        if (jumpTableLabels == undefined) {
            jumpTableLabels = [];
            this.jumpTables.set(jumpTable, jumpTableLabels);
        }
        if (jumpTableLabels.indexOf(label) < 0) {
            jumpTableLabels.push(label);
        }
        return [this.vi(jumpTable), " = ", { isDefinition: false, jumpTable, label }];
    }

    jumpTable(jumpTable: string): BasicLineIngredient[] {
        return [{ isDefinition: true, jumpTable }];
    }
}

export type { BasicProgramIngredient }
export { BasicProgramBuilder }
