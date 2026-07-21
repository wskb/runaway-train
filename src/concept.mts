
type StructuredConcept = readonly string[];
type Concept = StructuredConcept | string;
type StructuredPhrase = readonly StructuredConcept[];
type Phrase = readonly Concept[] | string;

const stopwords = new Set([
    "and",
    "the",
]);

function canonicalizePhrase(phrase: Phrase): StructuredPhrase {
    if (typeof phrase == "string") {
        return phrase.toLowerCase().replace(/[^0-9a-z\|]/g, " ")
            .split(" ")
            .filter(word => word.length > 0)
            .filter(word => !stopwords.has(word))
            .map(c => canonicalizeConcept(c));
    } else {
        return phrase.map(c => canonicalizeConcept(c));
    }
}

function canonicalizeConcept(concept: Concept): StructuredConcept {
    if (typeof concept == "string") {
        return canonicalizeConcept(concept.split("|"));
    } else {
        return concept.map(c => c.toLowerCase().replace(/[^0-9a-z]/g, "")).sort();
    }
}

function conceptsEqual(a: StructuredConcept, b: StructuredConcept) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

export type { Concept, StructuredConcept, Phrase, StructuredPhrase }
export { canonicalizeConcept, canonicalizePhrase, conceptsEqual }