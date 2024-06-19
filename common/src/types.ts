export interface Script {
    name: string;
    initialState: string;
    devices: 1 | 2;
    iterations?: number[];
    steps: ReadonlyArray<ScriptStep>;
}

export type ScriptRunnerStatus = 
    | "idle"
    | "waiting to stop"
    | { state: "paused"; stepIndex: number; iterCount: number; iterations: number; }
    | { state: "running"; stepIndex: number; iterCount: number; iterations: number; }
    ;

export type ScriptStep =
    | [cmd: "tap", location: string, side?: "left" | "right"]
    | [cmd: "swipe", from: string, to: string, side?: "left" | "right"]
    | [cmd: "wait", timeSpec: string]
    | [cmd: "mark"]
    | [cmd: "loop"]
    | [cmd: "load"]
    ;

export interface Layout {
    _filename: string;
    name: string;
    positions: Record<"left" | "right", Record<string, { x: number, y: number }>>;
}

export interface ServerStatusReport {
    portStatus: string;
    controllerStatus: string;
    scriptStatus: string;
}

export interface ServerState {
    homed: boolean;
    x: number;
    y: number;
    z: number;
}

export interface LearnCommand {
    layout: string;
    side: "left" | "right";
    position: string;
    x: number;
    y: number;
}

export interface RunCommand {
    script: string;
    layoutLeft: string | undefined;
    layoutRight: string | undefined;
}
