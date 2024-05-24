import { fail } from 'assert';
import { Script, Layout, ServerState, ScriptRunnerStatus } from '../../common/src/types';
import * as pc from "./print-controller";

let shouldPause = false;
let shouldStop = false;
let stepIndex = 0;
let markIndex = 0;
let iterCount = 0;
let iterations = 20;
let running = false;

// When now() > nextActionTime, it is OK to do something again
let nextActionTime = 0;

let script: Script;
let layouts = {
    left: undefined as Layout | undefined,
    right: undefined as Layout | undefined
}

export function stop() {
    shouldStop = true;
}

export function pause() {
    shouldPause = true;
}

export function resume() {
    shouldPause = false;
}

export function getStatus(): ScriptRunnerStatus {
    if (!running) {
        return "idle" as const;
    }
    if (shouldStop) {
        return "waiting to stop" as const;
    }
    if (shouldPause) {
        return {
            state: "paused",
            stepIndex,
            iterCount,
            iterations
        } as const;
    }
    return {
        state: "running",
        stepIndex,
        iterCount,
        iterations
    } as const;
}

export function runScript(_script: Script, _layoutLeft: Layout | undefined, _layoutRight: Layout | undefined) {
    script = _script;
    layouts = {
        left: _layoutLeft,
        right: _layoutRight
    };
    iterations = script.iterations ?? 1;

    console.log(`Running ${script.name} for ${iterations} iterations...`);
    
    markIndex = NaN;
    stepIndex = 0;
    shouldStop = false;
    shouldPause = false;
    iterCount = 0;

    runNextStep();
}

function sleep(ms: number) {
    return new Promise<void>(res => {
        setTimeout(res, ms);
    });
}

async function runNextStep() {
    if (shouldStop) {
        running = false;
        shouldStop = false;
        return;
    }

    if (shouldPause) {
        await sleep(200);
        runNextStep();
    }

    if (script.steps.length === stepIndex) {
        running = false;
        shouldPause = false;
        shouldStop = false;
        return;
    }

    const step = script.steps[stepIndex];
    switch(step[0]) {
        case "tap":
            const location = getPosition(step[1], step[2]);
            await pc.moveToPosition(location);
            await pc.finishMoves();
            await waitForSleep();
            await pc.tap();
            await pc.finishMoves();
            break;
        case "swipe":
            const start = getPosition(step[1], step[3]);
            const end = getPosition(step[2], step[3]);
            await pc.moveToPosition(start);
            await pc.finishMoves();
            await waitForSleep();
            await pc.swipe(start, end);
            break;
        case "wait":
            nextActionTime = nowInMilliseconds() + parseTime(step[1]);
            break;
        case "mark":
            markIndex = stepIndex;
            break;
        case "loop":
            iterCount++;
            console.log(`On iteration ${iterCount} / ${iterations}...`);
            if (iterCount === iterations) {
                // Fall through and continue execution to later line
            } else {
                stepIndex = markIndex;
            }
            break;
        case "load":
            await pc.load();
            break;
    }
    stepIndex++;
    runNextStep();

    async function waitForSleep() {
        const wait = nextActionTime - nowInMilliseconds();
        if (wait > 20) {
            await sleep(wait);
        }
    }
}

function parseTime(s: string): number {
    // 5000ms
    const msRegex = /^(\d)+ms$/i;
    if (msRegex.test(s)) {
        const ms = +(msRegex.exec(s)![1]);
        return ms;
    }
    // 4s
    const sRegex = /^(\d+)s$/i;
    if (sRegex.test(s)) {
        const ms = +(msRegex.exec(s)![1]) * 1000;
        return ms;
    }
    throw new Error("Invalid time spec");
}

function getPosition(name: string, side: "left" | "right" | undefined) {
    const result = worker();
    if (result === undefined) {
        return fail(`Failed to load position '${name}' from side ${side}`);
    }
    return result;

    function worker() {
        if (side === undefined) {
            if (layouts.left) {
                return layouts.left.positions.left[name];
            }
            if (layouts.right) {
                return layouts.right.positions.right[name];
            }
            return fail(`At least one layout must exist`);
        }
        const layout = layouts[side];
        if (!layout) {
            return fail(`Selected side does not exist`);
        }
        return layout.positions[side][name];
    }
}

function nowInMilliseconds() {
    return Date.now();
}