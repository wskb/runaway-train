import { writeFile } from "node:fs/promises";
import { BasicProgramBuilder, type BasicProgramIngredient } from "./basic.mjs";
import { diagramMarkdownContent, processedWorld, type UnresolvedCommandNode, type UnresolvedConceptNode } from "./story-compiler.mjs";
import { activities, commandNames, increment, welcome, type Action, type WorldStateContent } from "./story.mjs";
import path from "node:path";

/*
function addCompletion(builder: BasicProgramBuilder) {
    builder.add(b => [
        [b.vi("completion"), " = INT(RND(1)*46)"],
        [b.vs("displayedCompletion"), " = STR$(", b.vi("completion"), ")"],
        [b.vi("cappedCompletion"), " = ", b.vi("completion")],
        ["IF ", b.vi("completion"), " > 40 THEN ", b.vi("cappedCompletion"), ' = 40'],
        b.makeFor("progress", "0", [b.vi("cappedCompletion")], [
            ["INVERSE"],
            ["HTAB 1"],
            b.makeIfElse([b.v("progress"), " >= 19"],
                [
                    ["PRINT SPC(19);"],
                ], [
                    ["PRINT SPC(", b.v("progress"), ");"],
                    ["NORMAL"],
                    ["PRINT SPC(19 - ", b.v("progress"), ")"],
                ]
            ),
            b.makeIfElse([b.v("progress"), " = 20"], 
                [
                    b.makeIfElse(["LEN(", b.v("displayedCompletion"), ") = 1"],
                        [
                            ["PRINT SPC(1);"],
                            ["NORMAL"],
                            ["PRINT ", b.vs("displayedCompletion"), ";"],
                        ], [
                            ["PRINT LEFT$(", b.vs("displayedCompletion"), ", 1);"],
                            ["NORMAL"],
                            ["PRINT RIGHT$(", b.vs("displayedCompletion"), ", 1);"],
                        ]
                    )
                ], [
                    ["IF LEN(", b.v("displayedCompletion"), ") = 1 THEN PRINT SPC(1);"],
                    ["PRINT ", b.vs("displayedCompletion"), ";"],
                ]
            ),
            ["IF ", b.v("progress"), " > 21 THEN PRINT SPC(", b.v("progress"), " - 21);"],
        ]),
    ]);
}
*/

function fineTrainProgram() {
    const b = BasicProgramBuilder.builder();
    b.add(
        b.declareAndInitialize2dArray("RT", [...Array(80).keys()].map(i => [
            92 + 40 - Math.floor(i / 2) - 2 - Math.floor(i / 16),
            92 + 40 - Math.floor(i / 2),
            92 + 40 - Math.floor(i / 2) + 2 + Math.floor(i / 16),
            140 + 6 + Math.floor(i / 2),
            140 + 6 + Math.floor(i / 2) + 2 + Math.floor(i / 16),
            140 + 6 + Math.floor(i / 2) + 2 * (2 + Math.floor(i / 16)),
        ])),
        b.makeSubroutine("RENDERTRACK", [
            ["HCOLOR = 7"],
            ["HPLOT 0, 78 TO 279, 78"],
            [b.vi("renderOffset"), " = ", b.vi("renderCycle"), " - 16 * INT(", b.vi("renderCycle"), " / 16)"],
            ["IF ", b.v("fullRender"), " = 0 THEN ", b.vi("renderline"), " = ", b.vi("renderOffset"), " + 7 - 8 * INT((", b.vi("renderOffset"), " + 7) / 8)"],
            ["IF ", b.v("fullRender"), " = 1 THEN ", b.vi("renderline"), " = 0"],
            [b.declareLabel("render_track_loop")],
            [b.vi("tine"), " = 0"],
            ["IF (", b.v("renderline"), " + 16 - ", b.vi("renderOffset"), ") - 16 * INT((", b.v("renderline"), " + 16 -", b.vi("renderOffset"), ") / 16) < 8 THEN ", b.vi("tine"), " = 1"],
            [
                "IF ", b.v("tine"), " = 1 THEN HPLOT ",
                "RT%(", b.v("renderline"), ", 0)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 1) - 1",
                ", 79 + ", b.v("renderline"), 
            ],
            [
                "IF ", b.v("tine"), " = 0 AND ", b.v("fullRender"), " = 0 THEN HCOLOR = 0 : HPLOT ",
                "RT%(", b.v("renderline"), ", 0)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 1) - 1",
                ", 79 + ", b.v("renderline"), 
                " : HCOLOR = 7"
            ],
            [
                "IF ", b.v("fullRender"), " = 1 THEN HPLOT ",
                "RT%(", b.v("renderline"), ", 1)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 2) - 1",
                ", 79 + ", b.v("renderline"), 
            ],
            [
                "IF ", b.v("tine"), " = 1 THEN HPLOT ",
                "RT%(", b.v("renderline"), ", 2)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 3) - 1",
                ", 79 + ", b.v("renderline"), 
            ],
            [
                "IF ", b.v("tine"), " = 0 AND ", b.v("fullRender"), " = 0 THEN HCOLOR = 0 : HPLOT ",
                "RT%(", b.v("renderline"), ", 2)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 3) - 1",
                ", 79 + ", b.v("renderline"), 
                " : HCOLOR = 7"
            ],
            [
                "IF ", b.v("fullRender"), " = 1 THEN HPLOT ",
                "RT%(", b.v("renderline"), ", 3)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 4) - 1",
                ", 79 + ", b.v("renderline"), 
            ],
            [
                "IF ", b.v("tine"), " = 1 THEN HPLOT ",
                "RT%(", b.v("renderline"), ", 4)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 5) - 1",
                ", 79 + ", b.v("renderline"), 
            ],
            [
                "IF ", b.v("tine"), " = 0 AND ", b.v("fullRender"), " = 0 THEN HCOLOR = 0 : HPLOT ",
                "RT%(", b.v("renderline"), ", 4)",
                ", 79 + ", b.v("renderline"), 
                " TO ", 
                "RT%(", b.v("renderline"), ", 5) - 1",
                ", 79 + ", b.v("renderline"), 
                " : HCOLOR = 7"
            ],
            ["IF ", b.v("fullRender"), " = 0 THEN ", b.vi("renderline"), " = ", b.vi("renderline"), " + 8"],
            ["IF ", b.v("fullRender"), " = 1 THEN ", b.vi("renderline"), " = ", b.vi("renderline"), " + 1"],
            ["IF ", b.vi("renderline"), " > 79 THEN GOTO ", b.lineRef(1)],
            [b.gotoLabel("render_track_loop")],
        ]),
        ["HGR"], // clear screen #1
        [b.vi("fullRender"), " = 1"],
        b.callSubroutine("RENDERTRACK"),
        [b.vi("fullRender"), " = 0"],
        [b.vi("renderCycle"), " = ", b.vi("renderCycle"), " + 1"],
        ["IF ", b.vi("renderCycle"), ">= 80 THEN ", b.vi("renderCycle"), " = 0"],
        b.callSubroutine("RENDERTRACK"),
        ["GOTO ", b.lineRef(-4)],
    );
    return b;
}

function fullProgram() {
    const b = BasicProgramBuilder.builder();
    const world = processedWorld();
    b.add(
        ["DIM ", b.variableReference("worldState", "intarray"), `(${world.worldStateIndicies.size - 1})`],
        ["DIM ", b.variableReference("readBuffer", "intarray"), "(39)"],
        ["DIM ", b.variableReference("matchedConcepts", "intarray"), "(9)"],
        b.makeSubroutine("RESET", [
            b.makeFor("loop", "0", "39", [b.t`${"readBuffer"}(${"loop"}) = 0`]),
            b.makeFor("loop", "0", `${world.worldStateIndicies.size - 1}`, [b.t`${"worldState"}(${"loop"}) = 0`]),
            [b.vi("readMode"), " = 1"],
            [b.vi("renderScene"), " = 0"],
            [b.vi("nextAction"), " = 0"],
            [b.vi("command"), " = -1"],
        ]),
    );

    const conceptsArray: number[] = [];
    {
        let nextOffset = 0;
        const nodeOffsets = new Map<number, number>();
        const uncountedNodes = [world.conceptsGraphRoot];
        const unprocessedNodes: UnresolvedConceptNode[] = [];
        while (uncountedNodes.length) {
            const conceptNode = uncountedNodes.shift()!;
            nodeOffsets.set(conceptNode.id, nextOffset);
            nextOffset += conceptNode.edges.length * 2 + 1;
            unprocessedNodes.push(conceptNode);
            uncountedNodes.push(...conceptNode.edges.map(e => e.target).filter(n => !n.resolved));
        }
        while (unprocessedNodes.length) {
            const conceptNode = unprocessedNodes.shift()!;
            const offset = nodeOffsets.get(conceptNode.id)!;
            while (conceptsArray.length < offset + conceptNode.edges.length * 2 + 1) {
                conceptsArray.push(0);
            }
            for (let i = 0; i < conceptNode.edges.length; i++) {
                const edge = conceptNode.edges[i]!;
                conceptsArray[offset + i*2] = edge.letter == " " ? -1 : edge.letter.toUpperCase().charCodeAt(0);
                conceptsArray[offset + i*2 + 1] = edge.target.resolved ? edge.target.id : -nodeOffsets.get(edge.target.id)!;
            }
        }
    }
    b.add(b.declareAndInitializeArray("CONCEPTS", conceptsArray));

    const commandsArray: number[] = [];
    {
        let nextOffset = 0;
        const nodeOffsets = new Map<number, number>();
        const uncountedNodes = [world.commandGraphRoot];
        const unprocessedNodes: UnresolvedCommandNode[] = [];
        while (uncountedNodes.length) {
            const commandNode = uncountedNodes.shift()!;
            nodeOffsets.set(commandNode.id, nextOffset);
            nextOffset += commandNode.edges.length * 2 + 1;
            unprocessedNodes.push(commandNode);
            uncountedNodes.push(...commandNode.edges.map(e => e.target).filter(n => !n.resolved));
        }
        while (unprocessedNodes.length) {
            const commandNode = unprocessedNodes.shift()!;
            const offset = nodeOffsets.get(commandNode.id)!;
            while (commandsArray.length < offset + commandNode.edges.length * 2 + 1) {
                commandsArray.push(0);
            }
            for (let i = 0; i < commandNode.edges.length; i++) {
                const edge = commandNode.edges[i]!;
                commandsArray[offset + i*2] = edge.concept;
                commandsArray[offset + i*2 + 1] = edge.target.resolved ? edge.target.id : -nodeOffsets.get(edge.target.id)!;
            }
        }
    }
    b.add(b.declareAndInitializeArray("CMDS", commandsArray));
    b.add(b.gotoLabel("START"));

    const responseTests: BasicProgramIngredient = [];
    const transitionTests: BasicProgramIngredient = [];
    const activityActions: BasicProgramIngredient = [];
    const activityExits: BasicProgramIngredient = [];

    activityActions.push(
        [b.declareLabel("transition_welcome")],
        b.t`${"worldState"}(0) = 1`,
        b.setJump("nextAction", `transition_welcome_message`),
        b.t`GOTO ${b.labelRef("endAction")}`,
    );
    activityExits.push(
        [b.declareLabel("transition_welcome_message")],
        ...welcome.map(m => [`PRINT "${m}"`]),
        [b.vi("readMode"), " = 0"],
        b.t`${"nextAction"} = 0`,
        b.t`GOTO ${b.labelRef("endAction")}`,
    );

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i]!;
        activityActions.push(
            [b.declareLabel(`activity_action_${i}`)],
            ...activity.message.map(m => [`PRINT "${m}"`]),
        );
        
        const activityTest = "command" in activity ?
            b.t`IF ${"command"} = ${commandNames.indexOf(activity.command)} AND ` :
            b.t`IF `;
        let firstPrecondition = true;
        const preConditions = (activity.preConditions ?? {}) as any;
        for (const preCondition in preConditions) {
            const stateIndex = world.worldStateIndicies.get(preCondition)!;
            const test = preConditions[preCondition] as string | number | string[] | number[];
            if (firstPrecondition) {
                firstPrecondition = false;
            } else {
                activityTest.push(" AND ");
            }
            if (Array.isArray(test)) {
                activityTest.push("(");
                for (let i = 0; i < test.length; i++) {
                    if (i > 0) activityTest.push(" OR ");
                    const value = test[i]!;
                    let numberValue: number;
                    if (typeof value == "string") {
                        const preConditionValues = world.worldStateValues.get(preCondition);
                        if (preConditionValues == undefined) throw new Error(`state value not known ${preCondition}`);
                        const preConditionValue = preConditionValues.get(value);
                        if (preConditionValue == undefined) throw new Error(`state value not known ${preCondition} for value ${value}`);
                        numberValue = preConditionValue;
                    } else {
                        numberValue = value;
                    }
                    activityTest.push(...b.t`${"worldState"}(${stateIndex}) = ${numberValue}`);
                }
                activityTest.push(")");
            }
            else
            {
                let numberValue: number;
                if (typeof test == "string") {
                    const preConditionValues = world.worldStateValues.get(preCondition);
                    if (preConditionValues == undefined) throw new Error(`state value not known ${preCondition}`);
                    const preConditionValue = preConditionValues.get(test);
                    if (preConditionValue == undefined) throw new Error(`state value not known ${preCondition} for value ${test}`);
                    numberValue = preConditionValue;
                } else {
                    numberValue = test;
                }
                activityTest.push(...b.t`${"worldState"}(${stateIndex}) = ${numberValue}`);
            }
        }
        activityTest.push(...b.t` THEN ${b.setJump("nextAction", `activity_action_${i}`)} : GOTO ${b.labelRef("command" in activity ? "response_test_end" : "transition_test_end")}`);
        if ("command" in activity) {
            responseTests.push(activityTest);
        } else {
            transitionTests.push(activityTest);
        }

        let actionCountChanged = false;
        for (const postCondition in activity.postConditions) {
            if (postCondition == "actionCount") {
                actionCountChanged = true;
            }
            const stateIndex = world.worldStateIndicies.get(postCondition)!;
            const action = (activity.postConditions as any)[postCondition] as Action;
            if (action == increment) {
                activityActions.push( b.t`${"worldState"}(${stateIndex}) = 1 + ${"worldState"}(${stateIndex})` );
            } else if (typeof action == "number") {
                activityActions.push( b.t`${"worldState"}(${stateIndex}) = ${action}` );
            } else {
                const value = world.worldStateValues.get(postCondition)!.get(action)!;
                activityActions.push( b.t`${"worldState"}(${stateIndex}) = ${value}` );
            }
        }
        if (actionCountChanged) {
            activityActions.push(
                b.callSubroutine("transition_test"),
                b.t`GOTO ${b.labelRef("endAction")}`
            );
        } else if (activity.exitMessage != undefined) {
            activityExits.push(
                [b.declareLabel(`response_exit_${i}`)],
                ...activity.exitMessage.map(m => [`PRINT "${m}"`]),
                [b.vi("readMode"), " = 1"],
                b.setJump("nextAction", "completion"),
                b.t`GOTO ${b.labelRef("endAction")}`
            );
            activityActions.push(
                [b.vi("readMode"), " = 1"],
                b.t`${"worldState"}(0) = 4`,
                b.setJump("nextAction", `response_exit_${i}`),
                b.t`GOTO ${b.labelRef("endAction")}`
            );
        } else {
            activityActions.push(
                [b.vi("readMode"), " = 0"],
                b.t`${"nextAction"} = 0`,
                b.t`GOTO ${b.labelRef("endAction")}`
            );
        }
    }
    b.add(
        b.makeSubroutine("response_test", [
            ...responseTests,
            b.t`PRINT "Right here and now, you can't do that"`,
            [b.declareLabel("response_test_end")]
        ])
    );
    b.add(
        b.makeSubroutine("transition_test", [
            ...transitionTests,
            b.t`${"nextAction"} = 0`,
            [b.declareLabel("transition_test_end")]
        ])
    );
    b.add(...activityActions);
    b.add(...activityExits);

    b.add(
        b.makeSubroutine("PROMPT", [
            b.t`IF ${"readMode"} = 0 THEN INVERSE : PRINT ">"; : NORMAL`,
            b.t`IF ${"readMode"} = 1 THEN INVERSE : PRINT "ENTER TO CONTINUE>"; : NORMAL`,
        ]),
        b.makeSubroutine("PROCESSACTION", [
            b.t`IF ${"nextAction"} = 0 GOTO ${b.labelRef("endAction")}`,
            b.jumpTable("nextAction"),
            [b.declareLabel("endAction")],
            [...b.t`IF ${"nextAction"} = 0 THEN `, ...b.callSubroutine("PROMPT")],
        ]),
        b.makeSubroutine("PROCESSBUFFER", [
            b.makeIf(b.t`${"readMode"} = 0`, [
                b.t`${b.vi("command")} = -1`,
                b.makeFor("loop", "0", "9", [b.t`${"matchedConcepts"}(${"loop"}) = 0`]),
                b.t`${b.vi("inputIndex")} = 1`,
                [b.declareLabel("next_word")],
                b.t`${b.vi("parseIndex")} = 0`,
                [b.declareLabel("next_word_item")],
                b.t`${b.vi("searchItem")} = -1`,
                b.t`IF -${"inputIndex"} > ${"readBuffer"}(0) AND ${"readBuffer"}(${"inputIndex"}) <> 20 THEN ${"searchItem"} = ${"readBuffer"}(${"inputIndex"})`,
                b.makeIfElse(b.t`${"CONCEPTS"}(${"parseIndex"}) = ${"searchItem"}`, [
                    b.makeIfElse(b.t`${"CONCEPTS"}(${"parseIndex"} + 1) < 0`, [
                        b.t`${"parseIndex"} = -${"CONCEPTS"}(${"parseIndex"} + 1)`,
                        b.t`${"inputIndex"} = 1 + ${"inputIndex"}`,
                        b.gotoLabel("next_word_item"),
                    ], [
                        b.t`${"matchedConcepts"}(0) = 1 + ${"matchedConcepts"}(0)`,
                        b.t`${b.vi("matchedConcept")} = ${"CONCEPTS"}(${"parseIndex"} + 1)`,
                        b.t`${b.vi("matchedConceptIndex")} = 1`,
                        b.t`IF ${"matchedConcepts"}(${"matchedConceptIndex"}) = 0 THEN ${"matchedConcepts"}(${"matchedConceptIndex"}) = ${"matchedConcept"} : GOTO ${b.lineRef(3)}`,
                        b.t`IF ${"matchedConcepts"}(${"matchedConceptIndex"}) < ${"matchedConcept"} THEN ${"matchedConceptIndex"} = ${"matchedConceptIndex"} + 1 : GOTO ${b.lineRef(-1)}`,
                        b.t`IF ${"matchedConcepts"}(${"matchedConceptIndex"}) > ${"matchedConcept"} THEN ${b.vi("swap")} = ${"matchedConcept"} : ${"matchedConcept"} = ${"matchedConcepts"}(${"matchedConceptIndex"}) : ${"matchedConcepts"}(${"matchedConceptIndex"}) = ${"swap"} : GOTO ${b.lineRef(-2)}`,
                        b.gotoLabel("next_word"),
                    ]),
                ], [
                    b.makeIfElse(b.t`${"CONCEPTS"}(${"parseIndex"}) = 0`, [
                        b.t`REM CONSUME WORD`,
                        b.t`IF -${"inputIndex"} > ${"readBuffer"}(0) AND ${"readBuffer"}(${"inputIndex"}) <> 20 THEN ${"inputIndex"} = ${"inputIndex"} + 1 : GOTO ${b.lineRef(-1)}`,
                        b.t`IF -${"inputIndex"} =< ${"readBuffer"}(0) THEN GOTO ${b.lineRef(2)}`,
                        b.t`${"inputIndex"} = ${"inputIndex"} + 1`,
                        b.gotoLabel("next_word"),
                    ], [
                        b.t`${"parseIndex"} = 2 + ${"parseIndex"}`,
                        b.gotoLabel("next_word_item"),
                    ]),
                ]),
                b.makeIf(b.t`${"matchedConcepts"}(0) > 0`, [
                    b.t`${b.vi("inputIndex")} = 1`,
                    b.t`${b.vi("parseIndex")} = 0`,
                    [b.declareLabel("next_concept_parse")],
                    b.t`${b.vi("searchItem")} = -1`,
                    b.t`IF ${"inputIndex"} <= ${"matchedConcepts"}(0) THEN ${"searchItem"} = ${"matchedConcepts"}(${"inputIndex"})`,
                    [b.declareLabel("next_concept_item")],
                    b.makeIfElse(b.t`${"CMDS"}(${"parseIndex"}) = ${"searchItem"}`, [
                        b.makeIfElse(b.t`${"CMDS"}(${"parseIndex"} + 1) < 0`, [
                            b.t`${"parseIndex"} = -${"CMDS"}(${"parseIndex"} + 1)`,
                            b.t`${"inputIndex"} = 1 + ${"inputIndex"}`,
                            b.gotoLabel("next_concept_parse"),
                        ], [
                            b.t`${"command"} = ${"CMDS"}(${"parseIndex"} + 1)`,
                        ]),
                    ], [
                        b.t`IF ${"CMDS"}(${"parseIndex"}) = 0 THEN GOTO ${b.lineRef(2)}`,
                        b.t`${"parseIndex"} = 2 + ${"parseIndex"}`,
                        b.gotoLabel("next_concept_item"),
                    ]),
                ]),
                b.t`IF ${"command"} > -1 THEN GOSUB ${b.subroutineRef("response_test")}`,
                b.t`IF ${"command"} = -1 THEN PRINT "I'm sorry, I didn't understand that"`,
            ]),
            b.t`${"readBuffer"}(0) = 0`,
            b.callSubroutine("PROCESSACTION")
        ]),
        b.makeSubroutine("PROCESSINPUT", [
            [b.vi("readChar"), " = PEEK (-16384)"],
            ["POKE -16368, 0"],
            b.makeIf(b.t`${"readChar"} > 128`, [
                b.t`${"readChar"} = ${"readChar"} - 128`,
                b.makeIfElse(b.t`${"readMode"} = 1`, [
                    b.t`IF NOT (${"readChar"} = 10 OR ${"readChar"} = 13) THEN PRINT CHR$(9);`,
                    b.t`IF ${"readChar"} = 10 OR ${"readChar"} = 13 THEN ${"readBuffer"}(0) = -1`,
                ], [
                    b.makeIfElse(b.t`${"readChar"} = 127`, [
                        b.makeIf(b.t`${"readBuffer"}(0) > 0`, [
                            b.t`HTAB ${"readBuffer"}(0) + 1`,
                            [`PRINT " ";`],
                            b.t`HTAB ${"readBuffer"}(0) + 1`,
                            b.t`${"readBuffer"}(0) = ${"readBuffer"}(0) - 1`,
                        ]),
                    ], [
                        b.t`PRINT CHR$(${"readChar"});`,
                        b.t`IF ${"readChar"} >= 97 AND ${"readChar"} <= 122 THEN ${"readChar"} = ${"readChar"} - 32`,
                        b.makeIf(b.t`${"readChar"} = 20 OR (${"readChar"} >= 65 AND ${"readChar"} <= 90)`, [
                            b.t`${"readBuffer"}(0) = ${"readBuffer"}(0) + 1`,
                            b.t`${"readBuffer"}(${"readBuffer"}(0)) = ${"readChar"}`,
                        ]),
                        b.t`IF ${"readChar"} = 10 OR ${"readChar"} = 13 THEN ${"readBuffer"}(0) = -1 - ${"readBuffer"}(0)`,
                    ]),
                ]),
                b.t`IF ${"readBuffer"}(0) < 0 THEN GOSUB ${b.sub("PROCESSBUFFER")}`,
            ]),
        ]),
        b.makeSubroutine("RENDERSPACE", [
            ["HCOLOR = 7"],
            [b.vi("starRenderX"), " = INT(RND(-42))"],
            [b.vi("starRenderX"), " = 0"],
            [b.vi("starRenderY"), " = 0"],
            [b.declareLabel("starRenderLoop")],
            [b.vi("starRenderPosition"), " = ", b.vi("starRenderX"), " + INT(RND(1)*100) + 50"],
            [b.vi("starRenderX"), " = ", ...b.mod([b.vi("starRenderPosition")], "280")],
            [b.vi("starRenderY"), " = INT(",b.vi("starRenderPosition")," / 280) + ", b.vi("starRenderY")],
            ["IF ", b.vi("starRenderY"), ` >= 160 THEN `, ...b.gotoLabel("starRenderLoopExit")],
            ["IF ", ...b.mod([b.vi("starRenderCount")], "17"), " = 0 THEN HCOLOR = 0"],
            [b.vi("starRenderYOffset"), " = ", b.vi("starRenderY"), " * 32 + ", b.vi("starRenderY")],
            ["HPLOT ", b.vi("starRenderX"), ", ", ...b.mod([b.vi("starRenderYOffset")], "160")],
            ["IF ", ...b.mod([b.vi("starRenderCount")], "17"), " = 0 THEN HCOLOR = 7"],
            [b.vi("starRenderCount"), " = ", ...b.mod([b.vi("starRenderCount"), " + 1"], "32000")],
            b.callSubroutine("PROCESSINPUT"),
            [b.gotoLabel("starRenderLoop")],
            [b.declareLabel("starRenderLoopExit")],
        ]),
        b.makeSubroutine("RENDERTRACK", [
            ["COLOR = 15"],
            ["HLIN 0, 39 AT 19"],
            [b.vi("yRenderOffset"), " = ", ...b.mod([b.vi("renderCycle")], "4")],
            ["IF ", b.vi("renderMode"), " = 0 THEN ", b.vi("renderline"), " = 0"],
            ["IF ", b.v("renderMode"), " <> 0 THEN ", b.vi("renderline"), " = ", ...b.mod([b.vi("yRenderOffset"), " + 1"], "2")],
            [b.declareLabel("trackRenderLoop")],
            [b.vi("xRenderOffset"), " = 5 - INT(", b.vi("renderline"), " / 4)"],
            [b.vi("tine"), " = 0"],
            ["IF (", ...b.mod([b.v("renderline"), " + 4 - ", b.vi("yRenderOffset")], "4"), ") < 2 THEN ", b.vi("tine"), " = 1"],
            ["IF ", b.v("tine"), " = 1 THEN HLIN 10 + ", b.v("xRenderOffset"), ", 30 - ", b.v("xRenderOffset"), " AT 20 + ", b.v("renderline")], 
            ["IF ", b.v("tine"), " = 0 AND ", b.v("renderMode"), " = 0 THEN PLOT 12 + ", b.v("xRenderOffset"), ", 20 + ", b.v("renderline"), " : PLOT 28 - ", b.v("xRenderOffset"), ", 20 + ", b.v("renderline")], 
            b.makeIf([b.v("tine"), " = 0 AND ", b.v("renderMode"), " > 0"], [
                ["COLOR = 0"],
                ["HLIN 10 + ", b.v("xRenderOffset"), ", 10 + ", b.v("xRenderOffset"), " + 1 AT 20 + ", b.v("renderline")], 
                ["HLIN 10 + ", b.v("xRenderOffset"), " + 3, 30 - ", b.v("xRenderOffset"), " - 3 AT 20 + ", b.v("renderline")], 
                ["HLIN 30 - ", b.v("xRenderOffset"), " - 1, 30 - ", b.v("xRenderOffset"), " AT 20 + ", b.v("renderline")], 
                ["COLOR = 15"],
            ]),
            ["IF ", b.v("renderMode"), " = 0 THEN ", b.vi("renderline"), " = ", b.vi("renderline"), " + 1"],
            ["IF ", b.v("renderMode"), " > 0 THEN ", b.vi("renderline"), " = ", b.vi("renderline"), " + 2"],
            [b.vi("wait"), " = 0"],
            ["IF ", b.v("renderMode"), " = 1 THEN ", b.vi("wait"), " = 15"],
            b.makeFor("waitLoop", "0", [b.v("wait")], [
                b.callSubroutine("PROCESSINPUT"),
            ]),
            b.callSubroutine("PROCESSINPUT"),
            ["IF ", b.vi("renderline"), " > 19 THEN GOTO ", b.lineRef(1)],
            [b.gotoLabel("trackRenderLoop")],
        ]),
        [b.declareLabel("START")],
        b.callSubroutine("RESET"),
        ["TEXT : HOME"],
        [`PRINT "" : PRINT ""`],
        [`PRINT "               ____ OOoo"`],
        [`PRINT "               |DD|____T_"`],
        [`PRINT "               |_ |_____|<"`],
        [`PRINT "                 @-@-@-oo\\"`],
        [`PRINT "" : PRINT "" : PRINT "             RUNAWAY  TRAIN" : PRINT ""`],
        [`PRINT "  An interactive multimedia experience"`],
        [`PRINT "" : PRINT ""`],
        b.callSubroutine("PROMPT"),
        b.setJump("nextAction", "transition_welcome"),
        [b.declareLabel("renderloop")],
        b.makeIf(b.t`${"renderScene"} < 1 AND ${"worldState"}(0) = 1`, [
            ["GR : PRINT"],
            [b.vi("renderMode"), " = 0"],
            [b.vi("renderScene"), " = 1"],
            [b.vi("renderCycle"), " = 0"],
            b.callSubroutine("RENDERTRACK"),
            b.t`${"renderMode"} = 1`,
            b.callSubroutine("PROCESSACTION"),
        ]),
        b.makeIf(b.t`${"renderScene"} < 2 AND ${"worldState"}(0) = 2`, [
            [b.vi("renderScene"), " = 2"],
            b.t`${"renderMode"} = 2`,
            b.callSubroutine("PROCESSACTION"),
        ]),
        b.makeIf(b.t`${"renderScene"} < 3 AND ${"worldState"}(0) = 3`, [
            ["HGR"],
            [b.vi("renderScene"), " = 3"],
            [b.vi("starRenderCount"), " = 0"],
            b.callSubroutine("PROCESSACTION"),
        ]),
        b.makeIf(b.t`${"renderScene"} < 4 AND ${"worldState"}(0) = 4`, [
            ["TEXT : HOME"],
            [b.vi("renderScene"), " = 4"],
            b.callSubroutine("PROCESSACTION"),
        ]),
        b.makeIf(b.t`${"renderScene"} = 1 OR ${"renderScene"} = 2`, [
            b.t`${"renderCycle"} = ${"renderCycle"} + 1`,
            b.t`IF ${"renderCycle"} >= 40 THEN ${"renderCycle"} = 0`,
            b.callSubroutine("RENDERTRACK"),
            b.t`IF ${"renderScene"} <> ${"worldState"}(0) THEN GOTO ${b.labelRef("renderloop")}`,
            ["GOTO ", b.lineRef(-4)],
        ]),
        b.makeIf(b.t`${"renderScene"} = 3`, [
            b.callSubroutine("RENDERSPACE"),
            b.t`IF ${"renderScene"} <> ${"worldState"}(0) THEN GOTO ${b.labelRef("renderloop")}`,
            ["GOTO ", b.lineRef(-2)],
        ]),
        b.makeIf(b.t`${"renderScene"} = 0 OR ${"renderScene"} = 4`, [
            b.callSubroutine("PROCESSINPUT"),
            b.t`IF ${"renderScene"} <> ${"worldState"}(0) THEN GOTO ${b.labelRef("renderloop")}`,
            ["GOTO ", b.lineRef(-2)],
        ]),
        [b.declareLabel("completion")],
    );
    return b;
}

function whistleTestProgram() {
    const b = BasicProgramBuilder.builder();
    b.add(
        [b.t`${"L1"} = 100`],
        [b.t`${"L2"} = 250`],
        [b.t`${"L3"} = 150`],
        [b.t`${"L4"} = 50`],
        [b.t`${"L5"} = 100`],
        [b.t`${b.vi("speaker")} = -16336`],
        b.makeFor("loop", "1", [b.vi("L1")], [b.t`X = PEEK(${"speaker"})`]),
        b.makeFor("loop", "1", [b.vi("L2")], [b.t`X = ${"loop"}`]),
        b.makeFor("loop", "1", [b.vi("L3")], [b.t`X = PEEK(${"speaker"})`]),
        b.makeFor("loop", "1", [b.vi("L4")], [b.t`X = ${"loop"}`]),
        b.makeFor("loop", "1", [b.vi("L5")], [b.t`X = PEEK(${"speaker"})`]),
    );
    return b;
}

/*
https://www.atarimagazines.com/compute/issue41/Apple_Sounds_From_Beeps_To_Music.php
10 REM PR0GRAM#4
20 FOR LOC = 770 TO 780: READ BYTE: POKE LOC, BYTE : NEXT
30 POKE 768, INT ( RND (1) * 255) + 1 : POKE 769, INT ( RND (1) * 100) + 1: CALL 770: X = PEEK ( - 16384): IF X < 127 THEN POKE - 16368,0: GOTO 20
40 DATA 173,48, 192, 136,208,5,206, 1,3, 240,9,202,208,245, 174,0,3,76,2,3,96
50 POKE - 16368,0
*/

const destFolder = process.env["DEST"] ?? process.argv[2]!;

await writeFile(path.join(destFolder, "fineTrain.basic.txt"), fineTrainProgram().output(), { encoding: "utf-8" });
await writeFile(path.join(destFolder, "whistleTest.basic.txt"), whistleTestProgram().output(), { encoding: "utf-8" });
await writeFile(path.join(destFolder, "fullProgram.basic.txt"), fullProgram().output(), { encoding: "utf-8" });
//await writeFile(path.join(destFolder, "diagrams.md"), diagramMarkdownContent(), { encoding: "utf-8" })
