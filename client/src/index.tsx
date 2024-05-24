import * as React from 'preact';
import { useState, useCallback, useEffect, useMemo } from 'preact/hooks';
import type { Script, Layout, ServerState, LearnCommand, RunCommand } from '../../common/src/types';
import { getStepDescription } from '../../common/src/helpers';
import { ScriptList } from './script-list';
import { LayoutList } from './layout-list';
import { ScriptController } from './script-controller';
import { Joystick } from './joystick';
import { LearnController } from './learn-controller';

export type AppProps = {
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
        runScript: () => void;
        pauseScript: () => void;
        stopScript: () => void;
        move: (axis: "x" | "y" | "z" | "e", distance: number) => void;
    }
    lastResult: any;
    scripts: Script[];
    layouts: Layout[];
    selectedSingleSide: "left" | "right";
    selectedLayoutIndexLeft: number;
    selectedLayoutIndexRight: number;
    selectedScriptIndex: number;

    learnSelected: boolean;
};

let appProps: AppProps = {
    activeTab: "control",
    serverState: { homed: true, x: -1, y: -1, z: -1 },
    scrollback: "",
    lastResult: "",
    layouts: [],
    scripts: [],
    selectedSingleSide: "left",
    selectedLayoutIndexLeft: 0,
    selectedLayoutIndexRight: 0,
    selectedScriptIndex: 0,
    learnSelected: true,
    events: {
        tap: async () => {
            const result = await fetch("/tap", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };
            render();
        },
        off: async () => {
            const result = await fetch("/motors-off", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };
            render();
        },
        home: async () => {
            const result = await fetch("/motors-home", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };

            await fetch("/move-to-position", {
                method: "POST",
                body: JSON.stringify({ x: 130, y: 90 }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            render();
        },
        info: async () => {
            const result = await fetch("/info", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };
            render();
        },
        stopScript: async () => {
            const result = await fetch("/stop", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };
            render();
        },
        pauseScript: async () => {
            const result = await fetch("/pause", { method: "POST" });
            appProps = { ...appProps, lastResult: (await result.json()).toString() };
            render();
        },
        runScript: async () => {
            const script = appProps.scripts[appProps.selectedScriptIndex];
            let layoutLeft: string | undefined = undefined;
            let layoutRight: string | undefined = undefined;
            if ((script.devices == 2) || (appProps.selectedSingleSide === "left")) {
                layoutLeft = appProps.layouts[appProps.selectedLayoutIndexLeft].name;
            }
            if ((script.devices == 2) || (appProps.selectedSingleSide === "right")) {
                layoutRight = appProps.layouts[appProps.selectedLayoutIndexRight].name;
            }

            const command: RunCommand = {
                script: script.name,
                layoutLeft,
                layoutRight
            };
            fetch("/run", {
                method: "POST",
                body: JSON.stringify(command),
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
        load: () => {
            fetch("/load", { method: "POST" });
        },
        refresh: () => {
            fetch("./status.json").then(async res => {
                const serverState = await res.json();
                appProps = { ...appProps, serverState };
                render();
            });
        },
        stop: () => {
            fetch("/stop", { method: "POST" });
        }
    }
};

const InitFlags = {
    scripts: 1 << 0,
    layouts: 1 << 1,
    all: 0b11
} as const;
let initFlagsState = 0;

fetch("./scripts.json").then(async res => {
    const scripts = await res.json();
    appProps = { ...appProps, scripts };
    initFlagsState |= InitFlags.scripts;
    render();
});

fetch("./layouts.json").then(async res => {
    const layouts = await res.json();
    appProps = { ...appProps, layouts };
    initFlagsState |= InitFlags.layouts;
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
        <div class="tab-body">
            <If lhs="control" rhs={props.activeTab}>
                <div class="controller">
                    <Joystick {...props} />
                </div>
            </If>
            <If lhs="script" rhs={props.activeTab}>
                <ScriptController {...props} />
            </If>
            <If lhs="learn" rhs={props.activeTab}>
                <LearnController {...props} />
            </If>
        </div>
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

function StatusBar(props: { status: string }) {
    return <div class="status-bar">{props.status}</div>;
}

export function useCurryUpdateProp<K extends keyof AppProps>(key: K, value: AppProps[K]): () => void {
    return useCallback(() => updateProp(key, value), [key, value]);
}

function getPersistedProps() {
    const PersistedPropsKeys: readonly (keyof AppProps)[] = ["activeTab", "selectedLayoutIndexLeft", "selectedLayoutIndexRight", "selectedScriptIndex"];
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

export function updateProp<K extends keyof AppProps>(key: K, value: AppProps[K]) {
    appProps = { ...appProps, [key]: value };
    window.localStorage.setItem("props", JSON.stringify(getPersistedProps()));
    render();
}

function render() {
    if (initFlagsState !== InitFlags.all) return;
    React.render(<App {...appProps} />, document.getElementById("app")!);
}

function init() {
    appProps = { ...appProps, ...loadPersistedProps() };
    render();
}

init();
