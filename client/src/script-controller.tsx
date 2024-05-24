import * as React from 'preact';
import type { AppProps } from '.';
import { getLocationsOfStep, getStepDescription } from '../../common/src/helpers';
import type { Script } from '../../common/src/types';
import { LayoutList } from './layout-list';
import { ScriptList } from './script-list';
import { useCallback } from 'preact/hooks';

export function ScriptController(props: AppProps) {
    const run = useCallback(() => {
        props.events.runScript();
    }, [props.events]);
    const pause = useCallback(() => {
        props.events.pauseScript();
    }, [props.events]);
    const stop = useCallback(() => {
        props.events.stopScript();
    }, [props.events]);

    return <div class="horizontal-layout full-height">
        <div class="script-input-selector">
            <div class="script-options">
                <ScriptList {...props} />
                <LayoutList {...props} title="Left" side="left" />
                <LayoutList {...props} title="Right" side="right" />
            </div>

            {!!props.scripts[props.selectedScriptIndex] ? <ScriptStepList {...props} /> : null}
        </div>

        <div class="controller full-height">
            <button class="control-button" onClick={run}>Run</button>
            <button class="control-button" onClick={pause}>Pause</button>
            <button class="control-button" onClick={stop}>Stop</button>
        </div>
    </div>;
}

function ScriptStepList(props: AppProps) {
    const script: Script = props.scripts[props.selectedScriptIndex];
    const steps = script.steps;
    return <div class="script-step-list">
        {...steps.map(s => <ScriptStep {...props} step={s} />)}
    </div>;
}

function ScriptStep(props: AppProps & { step: Script["steps"][number] }) {
    const script: Script = props.scripts[props.selectedScriptIndex];
    switch(props.step[0]) {
        case "load":
        case "loop":
        case "mark":
        case "wait":
            return <div className="script-step"><span>{getStepDescription(props.step)}</span></div>
    }
    let positions;
    let side: "left" | "right" | undefined = undefined;
    if (script.devices === 2) {
        side = getSide(props.step)!;
        positions = (props.layouts[side === "left" ? props.selectedLayoutIndexLeft : props.selectedLayoutIndexRight]).positions[side];
    } else {
        positions = props.layouts[props.selectedSingleSide === "left" ? props.selectedLayoutIndexLeft : props.selectedLayoutIndexRight].positions[props.selectedSingleSide];
    }
    let isLocated = true;
    switch(props.step[0]) {
        case "swipe":
            isLocated &&= props.step[1] in positions;
            isLocated &&= props.step[2] in positions;
            break;
        case "tap":
            isLocated &&= props.step[1] in positions;
            break;
    }
    const sideIndicator = {
        "left": "< ",
        "right": "> ",
        "none": ""
    }[side ?? "none"];
    return <div className="script-step"><span className={isLocated ? "" : "unlocated"}>{sideIndicator}{getStepDescription(props.step)}</span></div>;
}

function getSide(step: Script["steps"][number]): "left" | "right" | undefined {
    switch (step[0]) {
        case "tap":
            return step[2];
        case "swipe":
            return step[3];
        case "load":
        case "loop":
        case "mark":
        case "wait":
            return undefined;
        default:
            step[0] satisfies never;
    }
}