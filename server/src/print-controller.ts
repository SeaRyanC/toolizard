import { Port, getSerialPort } from "./serial-port";

export type CommandResult =
    | { kind: "ok", drain: string }
    | { kind: "error", message: string }
    ;

let homed = false;
let x = 0;
let y = 0;
let z = 0;

export function getPosition(): "unknown" | { x: number, y: number, z: number } {
    if (homed) {
        return { x, y, z };
    }
    return "unknown";
}

let _workingPort: Port;
async function acquirePort() {
    if (_workingPort) {
        return _workingPort;
    }
    const port = await getSerialPort();
    _workingPort = port;
    return _workingPort;
}

async function doCommands(...s: string[]): Promise<CommandResult> {
    const port = await acquirePort();
    if (!port) {
        return { kind: "error", message: "No devices found" };
    }
    await port.writeCommands(...s);
    return { kind: "ok", drain: "" };
}

export function tap() {
    return doCommands(`M83`, "G0 E2", "G0 E-2");
}

export async function home() {
    const homeResult = await doCommands("G28");
    if (homeResult.kind === "error") return homeResult;
    homed = true;
    x = 0;
    y = 0;
    z = 0;
}

export function off() {
    return doCommands(`M18`);
}

export async function finishMoves() {
    return await doCommands(`M400`);
}

export async function moveToPosition(json: { x?: number, y?: number, z?: number, e?: number }) {
    if (!homed) {
        return { kind: "error", error: "Initiate 'home' first" };
    }

    if ("e" in json) {
        await doCommands(`M83`);
    }

    const parts = ["G0"];
    if ("x" in json) {
        x = json.x;
        parts.push(`X${json.x}`);
    }
    if ("y" in json) {
        y = json.y;
        parts.push(`Y${json.y}`);
    }
    if ("z" in json) {
        z = json.z;
        parts.push(`X${json.x}`);
    }
    if ("e" in json) {
        parts.push(`E${json.e}`);
    }
    parts.push(`F2500`);

    return await doCommands(`G90`, parts.join(" ") + "\n");
}

export async function moveAbsolute(json: { axis: string, position: number }) {
    if (!homed) {
        return { kind: "error", error: "Initiate 'home' first" };
    }
    switch (json.axis) {
        case "x":
        case "X":
            x = json.position;
            break;
        case "y":
        case "Y":
            y = json.position;
            break;
        case "z":
        case "Z":
            z = json.position;
            break;
    }
    return await doCommands(`G90`, `G0 ${json.axis.toUpperCase()}${json.position}`);
}

export async function moveRelative(json: { axis: string, distance: number }) {
    switch (json.axis) {
        case "x":
            x += json.distance;
            break;
        case "y":
            y += json.distance;
            break;
        case "z":
            z += json.distance;
            break;
    }

    return await doCommands(`G91`, `G0 ${json.axis.toUpperCase()}${json.distance}`);
}

export async function info() {
    return await doCommands(`M115`);
}

export async function swipe(start: { x: number; y: number; }, end: { x: number; y: number; }) {
    const midX = Math.round(start.x / 2 + end.x / 2);
    const midY = Math.round(start.y / 2 + end.y / 2);
    await moveToPosition(start);
    await moveToPosition({ x: midX, y: midY, e: 3 });
    await moveToPosition({ ...end, e: -3 });
}

export async function load() {
    if (!homed) {
        await doCommands("G28 Y");
        await moveRelative({ axis: "Y", distance: 200 });
    } else {
        await moveAbsolute({ axis: "Y", position: 200 });
    }
}

