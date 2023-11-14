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

    return <>
        <div class="row">
            <ScriptList {...props} />
            <LayoutList {...props} />
        </div>

        {!!props.scripts[props.selectedScriptIndex] ? <ScriptStepList {...props} /> : null }

        <div class="row controller">
            <button class="control-button" onClick={run}>▶️</button>
            <button class="control-button" onClick={pause}>⏯️</button>
            <button class="control-button" onClick={stop}>⏹️</button>
        </div>
    </>;
}

function ScriptStepList(props: AppProps) {
    const script: Script = props.scripts[props.selectedScriptIndex];
    return <table>
        {...script.steps.map(s => <ScriptStep {...props} step={s} />)}
    </table>;
}

function ScriptStep(props: AppProps & { step: Script["steps"][number]}) {
    const locations = getLocationsOfStep(props.step);
    const hasLocation = locations.every(loc => props.layouts[props.selectedLayoutIndex] && loc in props.layouts[props.selectedLayoutIndex].positions);
    return <tr>
        <td className={hasLocation ? "" : "unlocated"}>{getStepDescription(props.step)}</td>
    </tr>;
}
