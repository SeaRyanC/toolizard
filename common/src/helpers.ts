import { ScriptStep } from "./types";

export function getStepDescription(step: ScriptStep) {
    switch(step[0]) {
        case "tap":
            return `Tap ${step[1]}`;
        case "swipe":
            return `Swipe ${step[1]} to ${step[2]}`;
        case "wait":
            return `Wait for ${step[1]}`;
        case "load":
            return "Finish";
        case "mark":
            return "Mark";
        case "loop":
            return "Loop";
        default:
            assertNever(step[0], "Unknown step")
    }
}

export function getLocationsOfStep(step: ScriptStep): string[] {
    switch(step[0]) {
        case "tap":
            return [step[1]];
        case "swipe":
            return [step[1], step[2]];
        case "wait":
        case "load":
        case "mark":
        case "loop":
            return [];
        default:
            assertNever(step[0], "Unknown step")
    }
}

function assertNever(n: never, err: string): never {
    throw new Error(`${err}; expected not to see value ${n}`);
}