import * as React from 'preact';
import { useCallback, useState } from "preact/hooks";
import type { AppProps } from ".";
import { ServerState, LearnCommand, Script } from '../../common/src/types';
import { Joystick } from './joystick';
import { LayoutList } from './layout-list';
import { ScriptList } from './script-list';
import { JSX } from 'preact';

export function LearnController(props: AppProps) {
    const [index, setIndex] = useState(0);
    const script = props.scripts[props.selectedScriptIndex];

    const rows: (readonly [string, "left" | "right"])[] = [];
    for (const p of script.steps) {
        const command = p[0];
        if (command === "tap") {
            const location = p[1];
            const side = p[2] ?? props.selectedSingleSide;
            rows.push([location, side]);
        } else if (command === "swipe") {
            const side = p[3] ?? props.selectedSingleSide;
            rows.push([p[1], side]);
            rows.push([p[2], side]);
        } else {
            command satisfies "wait" | "mark" | "loop" | "load";
            continue;
        }
    }

    const currentTarget = rows[index];
    const currentTargetName = rows[index][0];
    const currentSide = rows[index][1];
    const currentLayoutIndex = currentTarget[1] === "left" ? props.selectedLayoutIndexLeft : props.selectedLayoutIndexRight;
    const currentLayout = props.layouts[currentLayoutIndex];
    const currentPos = props.layouts[currentLayoutIndex].positions[currentTarget[1]][currentTarget[0]];

    const nextStep = useCallback(() => {
        setIndex((index + 1) % rows.length);
    }, [props, index]);
    const prevStep = useCallback(() => {
        setIndex((index - 1 + rows.length) % rows.length);
    }, [props, index]);
    const save = useCallback(async () => {
        const status: ServerState = await (await fetch("./status.json")).json();
        const pos = { x: status.x, y: status.y };
        // Remote machine not actually connected, bail
        if (pos.x === -1 && pos.y === -1) return;
        
        // Update local copy
        currentLayout.positions[currentSide][currentTargetName] = pos;

        // Save on remote server
        const command: LearnCommand = {
            layout: currentLayout.name,
            side: currentSide,
            position: currentTargetName,
            x: pos.x,
            y: pos.y
        };
        fetch("/learn", {
            method: "POST",
            body: JSON.stringify(command),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }, [props, currentSide, currentTargetName, currentPos]);
    const goToCurrentPos = useCallback(() => {
        const command = {
            x: currentPos.x,
            y: currentPos.y
        };
        fetch("/move-to-possition", {
            method: "POST",
            body: JSON.stringify(command),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }, [currentPos]);


    return <div class="learn-controller">
        <Learner {...props} learnIndex={index} rows={rows} />
        <div class="learner-right-side">
            <Joystick {...props} />
            <div class="learn-target">
                <div><b>Target:</b> {rows[index][0]}</div>
                <div><b>Side:</b> {rows[index][1]}</div>
                <div><b>Current:</b> {currentPos ? <button onClick={goToCurrentPos}>{currentPos.x}, {currentPos.y}</button> : "(none)"}</div>
            </div>
            <div class="horizontal-layout learner-toolbar">
                <button onClick={prevStep}>Prev</button>
                <button onClick={save}>Save</button>
                <button onClick={nextStep}>Next</button>
            </div>
        </div>
    </div>;
}

function Learner(props: AppProps & { learnIndex: number, rows: (readonly [string, string])[] }) {
    const script = props.scripts[props.selectedScriptIndex];
    if (!script) return <></>;

    const hasLeftDevice = script.devices === 2 || props.selectedSingleSide === "left";
    const hasRightDevice = script.devices === 2 || props.selectedSingleSide === "right";

    const leftLayout = props.layouts[props.selectedLayoutIndexLeft];
    const rightLayout = props.layouts[props.selectedLayoutIndexRight];

    const { rows } = props;

    return <div class="learner-left-side">
        {hasLeftDevice ? <div class="target-device"><b>Device (left):</b> {leftLayout.name}</div> : null}
        {hasRightDevice ? <div class="target-device"><b>Device (right):</b> {rightLayout.name}</div> : null}
        <div class="script-to-learn"><b>Learning Script:</b> {script.name}</div>
        <table class="positions-to-learn">
            {...rows.map(getRow)}
        </table>
    </div>;

    function getRow(arg: readonly [name: string, side: string], index: number) {
        const [name, side] = arg;
        const selectionGlyph = props.learnIndex === index ? "→" : "";
        const displaySide = props.scripts[props.selectedScriptIndex].devices === 2 ? side : "";
        return <tr>
            <td>{selectionGlyph}</td>
            <td>{name}</td>
            <td>{displaySide}</td>
        </tr>;
    }

    async function go_to() {
        /*
        await fetch("/move-to-position", {
            method: "POST",
            body: JSON.stringify({ x, y }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        */
    }
}
