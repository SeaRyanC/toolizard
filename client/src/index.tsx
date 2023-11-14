import * as React from 'preact';
import { useState, useCallback, useEffect, useMemo } from 'preact/hooks';
import type { Script, Layout, ServerState, LearnCommand } from '../../common/src/types';
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
    selectedLayoutIndex: number;
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
    selectedLayoutIndex: 0,
    selectedScriptIndex: 0,
    learnSelected: true,
    events: {
        tap: async () => {
            // tap
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
            const script = appProps.scripts[appProps.selectedScriptIndex].name;
            const layout = appProps.layouts[appProps.selectedLayoutIndex].name;
            fetch("/run", {
                method: "POST",
                body: JSON.stringify({ script, layout }),
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
        },
        stop: () => {
            fetch("/stop", { method: "POST" });
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

function StatusBar(props: { status: string }) {
    return <div class="status-bar">{props.status}</div>;
}

export function useCurryUpdateProp<K extends keyof AppProps>(key: K, value: AppProps[K]): () => void {
    return useCallback(() => updateProp(key, value), [key, value]);
}

function getPersistedProps() {
    const PersistedPropsKeys: readonly (keyof AppProps)[] = ["activeTab", "selectedLayoutIndex", "selectedScriptIndex"];
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
    React.render(<App {...appProps} />, document.getElementById("app")!);
}

function init() {
    appProps = { ...appProps, ...loadPersistedProps() };
    render();
}

init();
