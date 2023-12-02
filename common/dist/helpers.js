"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationsOfStep = exports.getStepDescription = void 0;
function getStepDescription(step) {
    switch (step[0]) {
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
            assertNever(step[0], "Unknown step");
    }
}
exports.getStepDescription = getStepDescription;
function getLocationsOfStep(step) {
    switch (step[0]) {
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
            assertNever(step[0], "Unknown step");
    }
}
exports.getLocationsOfStep = getLocationsOfStep;
function assertNever(n, err) {
    throw new Error(`${err}; expected not to see value ${n}`);
}
