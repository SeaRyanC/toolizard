import * as React from 'preact';
import { AppProps, useCurryUpdateProp } from ".";

export function LayoutList(props: AppProps) {
    return <div class="layout-list">
        <h1>Layouts</h1>
        {...props.layouts.map((layout: any, index: number) => {
            return <div class={`layout ${index === props.selectedLayoutIndex ? "selected" : ""}`} onClick={useCurryUpdateProp("selectedLayoutIndex", index)}>{layout.name}</div>;
        })}
    </div>;
}
