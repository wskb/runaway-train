import { canonicalizePhrase, conceptsEqual, type StructuredConcept } from "./concept.mjs";
import { activities, commandNames, commands, culturalReferences, storyAdvancements, worldState, type CommandName, type Response, type Transition, type WorldStateContent } from "./story.mjs";

interface UnresolvedConceptNode {
    readonly resolved: false;
    readonly id: number;
    readonly edges: { letter: string, target: ConceptNode }[];
}

interface ResolvedConceptNode {
    readonly resolved: true;
    readonly id: number;
    readonly concept: StructuredConcept;
}

interface UnresolvedCommandNode {
    readonly resolved: false;
    readonly id: number;
    readonly edges: { concept: number, target: CommandNode }[];
}

interface ResolvedCommandNode {
    readonly resolved: true;
    readonly id: number;
}

type ConceptNode = ResolvedConceptNode | UnresolvedConceptNode;
type CommandNode = ResolvedCommandNode | UnresolvedCommandNode;

interface StoryDetails {
    readonly worldStateIndicies: Map<string, number>;
    readonly worldStateValues: Map<string, Map<string, number>>;
    readonly culturalRefsRangeInclusive: [number, number];
    readonly storyAdvancementsRangeInclusive: [number, number];
    readonly transitions: Transition[];
    readonly responses: Response[];
    readonly conceptsGraphRoot: UnresolvedConceptNode;
    readonly commandGraphRoot: UnresolvedCommandNode;
}

function processedWorld(): StoryDetails {
    const worldStateAttributes = new Set<string>(Object.keys(worldState));
    const worldStateIndicies = new Map<string, number>();
    const worldStateValues = new Map<string, Map<string, number>>();
    let culturalReferenceCount = 0;
    let storyAdvancementCount = 0;

    for (const attribute of worldStateAttributes.keys()) {
        const values = (worldState as any)[attribute] as WorldStateContent;
        if (Array.isArray(values) && values.length > 0 && typeof values[0] == "string") {
            const stringValues: string[] = values as string[];
            const attributeValues = new Map<string, number>();
            for (const value of stringValues) {
                attributeValues.set(value, attributeValues.size);
            }
            worldStateValues.set(attribute, attributeValues);
        }
    }

    if (worldStateAttributes.has("phase")) {
        worldStateIndicies.set("phase", 0);
        worldStateAttributes.delete("phase");
    }    
    for (const culturalRef of culturalReferences) {
        if (worldStateAttributes.has(culturalRef)) {
            culturalReferenceCount++;
            worldStateIndicies.set(culturalRef, worldStateIndicies.size);
            worldStateAttributes.delete(culturalRef);
        }    
    }    
    for (const storyAdvancement of storyAdvancements) {
        if (worldStateAttributes.has(storyAdvancement)) {
            storyAdvancementCount++;
            worldStateIndicies.set(storyAdvancement, worldStateIndicies.size);
            worldStateAttributes.delete(storyAdvancement);
        }    
    }    
    for (const otherAttribute of worldStateAttributes) {
        worldStateIndicies.set(otherAttribute, worldStateIndicies.size);
    }    
    const conceptsGraph = generateConceptsGraph();

    return {
        worldStateIndicies,
        worldStateValues,
        culturalRefsRangeInclusive: [1, culturalReferenceCount],
        storyAdvancementsRangeInclusive: [culturalReferenceCount + 1, storyAdvancementCount],
        transitions: activities.filter(a => !("command" in a)) as Transition[],
        responses: activities.filter(a => ("command" in a)) as Response[],
        conceptsGraphRoot: conceptsGraph.root,
        commandGraphRoot: generateCommandGraph(conceptsGraph.leaves),
    }
}

function generateConceptsGraph() {
    let transitionId = 500;
    const startConceptNode: UnresolvedConceptNode = { resolved: false, id: transitionId++, edges: []};
    const endConceptNodes: ResolvedConceptNode[] = [];
    for (const commandName of commandNames) {
        const command = commands[commandName];
        for (const phrase of command.phrases) {
            for (const concept of canonicalizePhrase(phrase)) {
                let conceptNode = endConceptNodes.find(c => conceptsEqual(c.concept, concept));
                if (conceptNode == null) {
                    conceptNode = {
                        resolved: true,
                        id: endConceptNodes.length + 1,
                        concept,
                    };
                    endConceptNodes.push(conceptNode);
                    for (const word of concept) {
                        let currentNode: UnresolvedConceptNode = startConceptNode;
                        const letters = word.split("");
                        while (letters.length > 0) {
                            const letter = letters.shift()!;
                            let edge = currentNode.edges.find(e => e.letter == letter);
                            if (edge == undefined) {
                                edge = { letter, target: { resolved: false, id: transitionId++, edges: []}};
                                currentNode.edges.push(edge);
                            }
                            if (!edge.target.resolved) {
                                currentNode = edge.target;
                            }
                            if (letters.length == 0) {
                                currentNode.edges.push({ letter: " ", target: conceptNode })
                            }
                        }
                    }
                }
            }
        }
    }
    return { root: startConceptNode, leaves: endConceptNodes };
}

function generateCommandGraph(endConceptNodes: ResolvedConceptNode[]) {
    let transitionId = 500;
    const startCommandNode: UnresolvedCommandNode = { resolved: false, id: transitionId++, edges: []};
    for (const commandName of commandNames) {
        const command = commands[commandName];
        const endCommandNode: ResolvedCommandNode = {
            resolved: true,
            id: commandNames.indexOf(commandName),
        }
        for (const phrase of command.phrases) {
            const phraseConcepts = canonicalizePhrase(phrase).map(concept => endConceptNodes.find(c => conceptsEqual(c.concept, concept))!.id).sort();
            let currentNode: UnresolvedCommandNode = startCommandNode;
            const remainingConcepts = [...phraseConcepts];
            while (remainingConcepts.length > 0) {
                const concept = remainingConcepts.shift()!;
                let edge = currentNode.edges.find(e => e.concept == concept);
                if (edge == undefined) {
                    edge = { concept, target: { resolved: false, id: transitionId++, edges: []}};
                    currentNode.edges.push(edge);
                }
                if (!edge.target.resolved) {
                    currentNode = edge.target;
                }
                if (remainingConcepts.length == 0) {
                    currentNode.edges.push({ concept: -1, target: endCommandNode })
                }
            }

        }
    }
    return startCommandNode;
}

function conceptsAsMermaid(startConceptNode: UnresolvedConceptNode) {

    let mermaid = "flowchart LR\n";
    let stack: ConceptNode[] = [startConceptNode];
    while (stack.length > 0) {
        const node = stack.pop()!;
        if (!node.resolved) {
            mermaid += `  N${node.id}["${node.id}"]\n`;
            for (const edge of node.edges) {
                mermaid += `  N${node.id} --"${edge.letter}"--> N${edge.target.id}\n`;
                stack.push(edge.target);
            }
        } else {
            mermaid += `  N${node.id}["${node.id}: ${node.concept.join(", ")}"]\n`;
        }
    }

    return mermaid;
}

function commandsAsMermaid(startNode: UnresolvedCommandNode) {

    let mermaid = "flowchart LR\n";
    let stack: CommandNode[] = [startNode];
    while (stack.length > 0) {
        const node = stack.pop()!;
        if (!node.resolved) {
            mermaid += `  N${node.id}["${node.id}"]\n`;
            for (const edge of node.edges) {
                mermaid += `  N${node.id} --"${edge.concept}"--> N${edge.target.id}\n`;
                stack.push(edge.target);
            }
        } else {
            mermaid += `  N${node.id}["command: ${node.id}"]\n`;
        }
    }

    return mermaid;
}

function diagramMarkdownContent() {
    const conceptsGraph = generateConceptsGraph();
    const conceptsDiagram = conceptsAsMermaid(conceptsGraph.root);
    const commandDiagram = commandsAsMermaid(generateCommandGraph(conceptsGraph.leaves));
    const delimeter = "````";
    return `\n${delimeter}mermaid\n${conceptsDiagram}\n${delimeter}\n\n${delimeter}mermaid\n${commandDiagram}\n${delimeter}`;
}

export type { UnresolvedConceptNode, UnresolvedCommandNode }
export { processedWorld, diagramMarkdownContent }
