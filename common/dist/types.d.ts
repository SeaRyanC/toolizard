export interface Script {
    name: string;
    iterations?: number[];
    steps: ReadonlyArray<ScriptStep>;
}
export type ScriptRunnerStatus = "idle" | "waiting to stop" | {
    state: "paused";
    stepIndex: number;
    iterCount: number;
    iterations: number;
} | {
    state: "running";
    stepIndex: number;
    iterCount: number;
    iterations: number;
};
export type ScriptStep = [cmd: "tap", location: string] | [cmd: "swipe", from: string, to: string] | [cmd: "wait", timeSpec: string] | [cmd: "load"] | [cmd: "mark"] | [cmd: "loop"];
export interface Layout {
    _filename: string;
    name: string;
    positions: Record<string, {
        x: number;
        y: number;
    }>;
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
    position: string;
    x: number;
    y: number;
}
export interface RunCommand {
    script: string;
    layout: string;
    count: number;
}
