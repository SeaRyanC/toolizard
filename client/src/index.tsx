import * as React from 'preact';
import { useState, useCallback, useEffect, useMemo } from 'preact/hooks';
import { Script, Layout, ServerState, LearnCommand } from '../../common/src/types';
import { getStepDescription } from '../../common/src/helpers';

type AppProps = {
    activeTab: "control" | "script" | "learn",
    serverState: ServerState;
    scrollback: string;
    events: {
        tap: () => void;
        refresh: () => void;
        off: () => void;
        home: () => void;
        info: () => void;
        load: () => void;
        stop: () => void;
        run: (script: string, layout: string) => void;
        move: (axis: "x" | "y" | "z" | "e", distance: number) => void;
    }
    lastResult: any;
    scripts: Script[];
    layouts: Layout[];
    selectedLayoutIndex: number;
    selectedScriptIndex: number;

    learnSelected: boolean;
};

const PersistedPropsKeys = ["activeTab", "selectedLayoutIndex", "selectedScriptIndex"] as const;
type PersistableProps = Pick<AppProps, (typeof PersistedPropsKeys)[number]>;

let appProps: AppProps = {
    activeTab: "control",
    serverState: { homed: true, x: -1, y: -1, z: -1 },
    scrollback: "",
    lastResult: "",
    layouts: [],
    scripts: [],
    selectedLayoutIndex: 0,
    selectedScriptIndex: 0,
    learnSelected: true,
    events: {
        tap: async () => {
            // tap
            const result = await fetch("/tap", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() }
            render();
        },
        off: async () => {
            const result = await fetch("/motors-off", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() }
            render();
        },
        home: async () => {
            const result = await fetch("/motors-home", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() }
            render();
        },
        info: async () => {
            const result = await fetch("/info", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() }
            render();
        },
        stop: async () => {
            const result = await fetch("/stop", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() }
            render();
        },
        run: async (script, layout) => {
            fetch("/run", {
                method: "POST",
                body: JSON.stringify({ script, layout, count: 20 }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },
        move: (axis, distance) => {
            fetch("/move-relative", {
                method: "POST",
                body: JSON.stringify({ axis, distance }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },
        load: async () => {
            const result = await fetch("/load", { method: "POST" });
        },
        refresh: () => {

        }
    }
};

fetch("./scripts.json").then(async res => {
    const scripts = await res.json();
    appProps = { ...appProps, scripts };
    render();
});

fetch("./layouts.json").then(async res => {
    const layouts = await res.json();
    appProps = { ...appProps, layouts };
    render();
});

fetch("./status.json").then(async res => {
    const serverState = await res.json();
    appProps = { ...appProps, serverState };
    render();
});

function App(props: AppProps) {
    return <>
        <div class="tab-list">
            <span class={classNames({ "tab-item": true, "selected": props.activeTab === "control" })} onClick={useCurryUpdateProp("activeTab", "control")}>Control</span>
            <span class={classNames({ "tab-item": true, "selected": props.activeTab === "script" })} onClick={useCurryUpdateProp("activeTab", "script")}>Script</span>
            <span class={classNames({ "tab-item": true, "selected": props.activeTab === "learn" })} onClick={useCurryUpdateProp("activeTab", "learn")}>Learn</span>
        </div>
        <If lhs="control" rhs={props.activeTab}>
            <Joystick {...props} />
        </If>
        <If lhs="script" rhs={props.activeTab}>
            <ScriptController {...props} />
        </If>
        <If lhs="learn" rhs={props.activeTab}>
            <LearnController {...props} />
        </If>

        <StatusBar status={props.lastResult} />
    </>;
}

function classNames(obj: { [key: string]: boolean }) {
    return Object.keys(obj).filter(k => obj[k]).join(" ");
}

function If(props: { lhs: string, rhs: string, children: any }) {
    if (props.lhs === props.rhs) {
        return props.children;
    }
    return null;
}

function ScriptController(props: AppProps) {
    return <>
        <div class="row">
            <ScriptList {...props} />
            <LayoutList {...props} />
        </div>

        <button onClick={() => {
            props.events.run(appProps.scripts[appProps.selectedScriptIndex].name, appProps.layouts[appProps.selectedLayoutIndex].name);
        }}>Run</button>
        {!!props.scripts[props.selectedScriptIndex] ? <ScriptStepList {...props} /> : null }
    </>;
}

function LearnController(props: AppProps) {
    return <>
        <div class="row">
            <ScriptList {...props} />
            <LayoutList {...props} />
        </div>
        <Joystick {...props} />
        <Learner {...props} />
    </>;
}

function ScriptStepList(props: AppProps) {
    const script: Script = props.scripts[props.selectedScriptIndex];
    return <table>
        {...script.steps.map(s => <ScriptStep {...props} step={s} />)}
    </table>;
}

function ScriptStep(props: AppProps & { step: Script["steps"][number]}) {
    return <tr>
        <td>{getStepDescription(props.step)}</td>
    </tr>
}

function ScriptList(props: AppProps) {
    return <div class="script-list">
        <h1>Scripts</h1>
        {...props.scripts.map((script: any, index: number) => {
            return <div class={`script ${index === props.selectedScriptIndex ? "selected" : ""}`} onClick={select}>{script.name}</div>;
            function select() {
                appProps = { ...appProps, selectedScriptIndex: index };
                render();
            }
        })}
    </div>;
}

function LayoutList(props: AppProps) {
    return <div class="layout-list">
        <h1>Layouts</h1>
        {...props.layouts.map((layout: any, index: number) => {
            return <div class={`layout ${index === props.selectedLayoutIndex ? "selected" : ""}`} onClick={select}>{layout.name}</div>;
            function select() {
                appProps = { ...appProps, selectedLayoutIndex: index };
                render();
            }
        })}
    </div>;
}

function Learner(props: AppProps) {
    const layout = props.layouts[props.selectedLayoutIndex];
    const script = props.scripts[props.selectedScriptIndex];
    if (!layout || !script) return <></>;

    // Sort unknown positions first
    const positions = getPositionNames(script);
    positions.sort((a, b) => {
        return +(a in layout.positions) - +(b in layout.positions);
    });

    return <div class="learner"><table class="learner">
        {...positions.map(pos => {
            let x = layout.positions[pos]?.x ?? "?";
            let y = layout.positions[pos]?.y ?? "?";
            return <tr>
                <td>{pos}</td>
                <td className="position">{x}</td>
                <td className="position">{y}</td>
                <td><button className="learn" onClick={save}>💾</button></td>
                <td><button className="goto" onClick={go_to}>👉</button></td>
            </tr>;

            async function save() {
                const status: ServerState = await (await fetch("./status.json")).json();
                layout.positions[pos] = { x: status.x, y: status.y };
                render();
                const command: LearnCommand = {
                    layout: layout.name,
                    position: pos,
                    x: status.x,
                    y: status.y
                };
                fetch("/learn", {
                    method: "POST",
                    body: JSON.stringify(command),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }

            async function go_to() {
                await fetch("/move-to-position", {
                    method: "POST",
                    body: JSON.stringify({ x, y }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        })}
    </table></div>;
}

function Joystick(props: AppProps) {
    const move = useCallback((axis: "x" | "y" | "z" | "e", distance: number) => () => props.events.move(axis, distance), [props.events.move]);
    const home = useCallback(() => props.events.home(), [props.events.home]);
    const tap = useCallback(() => props.events.tap(), [props.events.tap]);

    return <table class="joystick">
        <tr>
            <td><Button onClick={props.events.off}>🚫</Button></td>
            <td></td>
            <td><Button onClick={move("y", 10)}>▲</Button></td>
            <td></td>
            <td><Button critical={!props.serverState.homed} onClick={props.events.home}>🏠</Button></td>
        </tr>
        <tr><td></td><td></td><td><Button onClick={move("y", 1)}>▲</Button></td><td></td><td></td></tr>
        <tr>
            <td><Button onClick={move("x", -10)}>◀</Button></td>
            <td><Button onClick={move("x", -1)}>◀</Button></td>
            <td><Button onClick={tap}>👇</Button></td>
            <td><Button onClick={move("x", 1)}>▶</Button></td>
            <td><Button onClick={move("x", 10)}>▶</Button></td>
        </tr>
        <tr><td></td><td></td><td><Button onClick={move("y", -1)}>▼</Button></td><td></td><td></td></tr>
        <tr>
            <td><Button onClick={props.events.stop}>🛑</Button></td>
            <td></td>
            <td><Button onClick={move("y", -10)}>▼</Button></td>
            <td></td>
            <td><Button onClick={props.events.load}>📱</Button></td>
        </tr>
    </table>
}

type ButtonProps = {
    onClick: () => void;
    critical?: boolean;
    children: any;
}
function Button(props: ButtonProps) {
    return <button class={props.critical ? "critical" : ""} onClick={props.onClick}>{...props.children}</button>;
}

function StatusBar(props: { status: string }) {
    return <div class="status-bar">{props.status}</div>;
}

function useCurryUpdateProp<K extends keyof AppProps>(key: K, value: AppProps[K]): () => void {
    return useCallback(() => updateProp(key, value), [key, value]);
}

function getPersistedProps() {
    return Object.fromEntries(Object.entries(appProps).filter(([key]) => PersistedPropsKeys.includes(key as any)));
}

function loadPersistedProps() {
    try {
        const s = window.localStorage.getItem("props");
        if (s === null) return {};
        return JSON.parse(s);
    } catch {
        return {};
    }
}

function updateProp<K extends keyof AppProps>(key: K, value: AppProps[K]) {
    appProps = { ...appProps, [key]: value };
    window.localStorage.setItem("props", JSON.stringify(getPersistedProps()));
    render();
}

function getPositionNames(script: Script) {
    const positions: string[] = [];
    for (const step of script.steps) {
        switch (step[0]) {
            case "swipe":
                add(step[1], step[2]);
                break;
            case "tap":
                add(step[1]);
                break;
            case "loop":
            case "mark":
            case "wait":
                break;
        }
    }
    return positions;

    function add(...pos: string[]) {
        for (const p of pos) {
            if (positions.indexOf(p) >= 0) continue;
            positions.push(p);
        }
    }
}

function render() {
    React.render(<App {...appProps} />, document.getElementById("app")!);
}

function init() {
    appProps = { ...appProps, ...loadPersistedProps() };
    render();
}

init();
