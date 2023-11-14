import * as React from 'preact';
import { AppProps, useCurryUpdateProp } from ".";

export function ScriptList(props: AppProps) {
    return <div class="script-list">
        <h1>Scripts</h1>
        {...props.scripts.map((script: any, index: number) => {
            return <div class={`script ${index === props.selectedScriptIndex ? "selected" : ""}`} onClick={useCurryUpdateProp("selectedScriptIndex", index)}>{script.name}</div>;
        })}
    </div>;
}
