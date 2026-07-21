import { writeFile } from "node:fs/promises";
import { canonicalizePhrase, conceptsEqual, type StructuredConcept } from "./concept.mjs";
import { activities, culturalReferences, storyAdvancements, worldState, type Transition, type WorldStateContent } from "./story.mjs";

interface ResolvedConceptNode {
    readonly transition: false;
    readonly conceptId: number;
    readonly concept: StructuredConcept;
    readonly previous: TransitionConceptNode[];
}

interface TransitionConceptNode {
    readonly transition: true;
    readonly transitionId: number;
    readonly character: string;
    readonly next: ConceptNode[];
    readonly previous: TransitionConceptNode[];
}

type ConceptNode = ResolvedConceptNode | TransitionConceptNode;

interface Continuation {
    id: number;
    message: string[];
    continuedBy?: number;
}

interface StoryDetails {
    readonly worldStateIndicies: Map<string, number>;
    readonly worldStateValues: Map<string, Map<string, number>>;
    readonly culturalRefsRangeInclusive: [number, number];
    readonly storyAdvancementsRangeInclusive: [number, number];
    readonly transitions: Transition[];
}

function processedWorld(): StoryDetails {
    const worldStateAttributes = new Set<string>(Object.keys(worldState));
    const worldStateIndicies = new Map<string, number>();
    const worldStateValues = new Map<string, Map<string, number>>();
    let culturalReferenceCount = 0;
    let storyAdvancementCount = 0;

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

    return {
        worldStateIndicies,
        worldStateValues,
        culturalRefsRangeInclusive: [1, culturalReferenceCount],
        storyAdvancementsRangeInclusive: [culturalReferenceCount + 1, storyAdvancementCount],
        transitions: activities.filter(a => !("command" in a)) as Transition[],
    }
}

function conceptsAsMermaid(startConceptNodes: TransitionConceptNode[], endConceptNodes: ResolvedConceptNode[]) {

    let mermaid = "flowchart LR\n";
    let stack: ConceptNode[] = [...endConceptNodes];
    while (stack.length > 0) {
        const node = stack.pop()!;
        for (const target of node.previous) {
            mermaid += `  ${target.character}${target.transitionId}["${target.character}"]\n`;
            stack.push(target);
            if (node.transition) {
                mermaid += `  ${target.character}${target.transitionId} --> ${node.character}${node.transitionId}\n`;
            } else {
                mermaid += `  ${target.character}${target.transitionId} --> concept_${node.conceptId}\n`;
                mermaid += `  concept_${node.conceptId}["${node.conceptId}: ${node.concept.join(", ")}"]\n`;
            }
        }
    }
    for (let start of startConceptNodes) {
        mermaid += `  start --> ${start.character}${start.transitionId}\n`
    }

    return mermaid;
}

function generateConceptsDiagram() {
    let transitionId = 0;
    const startConceptNodes: TransitionConceptNode[] = [];
    const endConceptNodes: ResolvedConceptNode[] = [];
    for (const activity of activities) {
        if ("command" in activity) {
            for (const phrase of activity.command.phrases) {
                for (const concept of canonicalizePhrase(phrase)) {
                    let conceptNode = endConceptNodes.find(c => conceptsEqual(c.concept, concept));
                    if (conceptNode == null) {
                        conceptNode = {
                            transition: false,
                            conceptId: endConceptNodes.length,
                            concept,
                            previous: [],
                        };
                        endConceptNodes.push(conceptNode);
                        for (const word of concept) {
                            let lastTransition: TransitionConceptNode | undefined = undefined;
                            const letters = word.split("");
                            while (letters.length > 0) {
                                const letter = letters.pop()!;
                                const targetPreviousNodes: TransitionConceptNode[] = (lastTransition?.previous ?? conceptNode.previous);
                                let previousNode = targetPreviousNodes.find(n => n.character == letter);
                                if (previousNode == null) {
                                    previousNode = {
                                        transition: true,
                                        character: letter,
                                        transitionId: transitionId++,
                                        next: [lastTransition ?? conceptNode],
                                        previous: [],
                                    }
                                    targetPreviousNodes.push(previousNode);
                                    if (letters.length == 0) {
                                        startConceptNodes.push(previousNode);
                                    }
                                }
                                lastTransition = previousNode;
                            }
                        }
                    }
                }
            }
        }
    }
    return conceptsAsMermaid(startConceptNodes, endConceptNodes);
}
/*
async function writeDiagrams() {
    const conceptsDiagram = generateConceptsDiagram();
    const delimeter = "````";
    const content = `${delimeter}mermaid\n${conceptsDiagram}\n${delimeter}`;
    await writeFile(process.argv[2]!, content, { encoding: "utf-8" });
}

await writeDiagrams();
*/
export { processedWorld }
