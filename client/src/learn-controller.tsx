import * as React from 'preact';
import { useCallback } from "preact/hooks";
import type { AppProps } from ".";
import { ServerState, LearnCommand, Script } from '../../common/src/types';
import { Joystick } from './joystick';
import { LayoutList } from './layout-list';
import { ScriptList } from './script-list';

export function LearnController(props: AppProps) {
    return <>
        <div class="row">
            <ScriptList {...props} />
            <LayoutList {...props} />
        </div>
        <Joystick {...props} />
        <Learner {...props} />
    </>;
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

