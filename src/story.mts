import type { Phrase } from "./concept.mjs";

const counter: unique symbol = Symbol("counter");

type WorldStateContent = string[] | number[] | typeof counter;
const worldState = {
    phase: ["lobby", "slow", "fast", "space", "end", "score"],
    actionCount: counter,
    location: ["booth", "tender", "ledge"],
    soulAsylumSongReferenced: [0, 1],
    doorOpened: [0, 1],
    windowClosed: [0, 1],
    jumpedOff: [0, 1],
} as const satisfies Record<string, WorldStateContent>;
type WorldState = keyof typeof worldState;

const culturalReferences = [
    "soulAsylumSongReferenced",
] as const satisfies WorldState[];

const storyAdvancements = [
    "jumpedOff",
    "windowClosed"
] as const satisfies WorldState[];

interface Command {
    readonly phrases: readonly Phrase[];
    readonly strict?: true;
}

const increment: unique symbol = Symbol("increment");

interface Response {
    readonly command: Command;
    readonly preConditions?: Partial<Record<WorldState, string | number | string[] | number[]>>;
    readonly postConditions?: Partial<Record<WorldState, string | number | typeof increment>>;
    readonly message: readonly string[];
    readonly exitMessage?: readonly string[];
}

interface Transition {
    readonly preConditions?: Partial<Record<WorldState, string | number | string[] | number[]>> & Record<"actionCount", number | number[]>;
    readonly postConditions?: Partial<Record<WorldState, string | number | typeof increment>>;
    readonly message: readonly string[],
    readonly exitMessage?: readonly string[];
}

const concepts = {
    jump: ["jump", "leap", "hop"],
    override: ["sudo", "anyway", "harder"],
} as const;

const commands = {
    jump: {
        phrases: [
            [concepts.jump],
            [concepts.jump, ["out", "off"]],
            "tuck and roll",
        ],
        strict: true
    },
    jumpOverride: {
        phrases: [concepts.jump, concepts.override],
        strict: true
    },
} as const satisfies Record<string, Command>;

const welcome = [
    "You are in the conductor's booth of a",
    "freight train moving through the plains",
    "Type out what to do next",
] as const;

const actionThresholds = {
    fast: 10,
    space: 15,
    end: 17
} as const;

const activities: (Response|Transition)[] = [
    {
        command: commands.jump,
        preConditions: {
            phase: "slow",
            location: "ledge",
        },
        postConditions: {
            jumpedOff: 1,
        },
        message: [
            "You wait for a soft patch of grass and",
            "and leap off the ledge, rolling once and",
            "then standing up unharmed",
        ],
        exitMessage: [
            "You look up at the train going by, now",
            "without a conductor to control it. It",
            "appears to pick up speed as you watch.",
        ],
    },
    {
        preConditions: {
            actionCount: actionThresholds.fast,
            windowClosed: 1
        },
        postConditions: {
            phase: "fast",
        },
        message: [
            "You sway as the train picks up the pace",
            "The spedometer show a doubling of speed",
            "You see the fields fly by outside",
        ],
    },
    {
        preConditions: {
            actionCount: actionThresholds.fast,
            windowClosed: 0
        },
        postConditions: {
            phase: "fast",
        },
        message: [
            "You sway as the train picks up the pace",
            "The spedometer show a doubling of speed",
            "The breeze blows through the open window",
        ],
    },
    {
        command: commands.jump,
        preConditions: {
            phase: ["fast", "space", "hyperspace", "ludicrous"],
            location: "ledge",
        },
        message: [
            "You exit the booth onto the thin walkway",
            "and jump off into the grassy field",
            "rolling once and then standing unharmed",
        ],
        exitMessage: [
            "You look up at the train going by, now",
            "without a conductor to control it. It",
            "appears to pick up speed as you watch.",
        ],
    },
];

export type { Response, Transition, WorldStateContent }
export { activities, welcome, worldState, culturalReferences, storyAdvancements }
