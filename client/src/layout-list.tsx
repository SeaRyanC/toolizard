import * as React from 'preact';
import { AppProps, updateProp, useCurryUpdateProp } from ".";
import { useCallback } from 'preact/hooks';

export function LayoutList(props: AppProps & { title: string, side: "left" | "right" }) {
    const prop = props.side === "left" ? "selectedLayoutIndexLeft" : "selectedLayoutIndexRight";
    let mySelectedIndex: number | undefined = undefined;
    if (props.scripts[props.selectedScriptIndex].devices === 1) {
        if (props.selectedSingleSide === props.side) {
            mySelectedIndex = props[prop];
        }
    } else {
        mySelectedIndex = props[prop];
    }
    
    return <div class="layout-list">
        <h1>{props.title}</h1>
        {...props.layouts.map((layout: any, index: number) => {
            return <LayoutItem {...props} index={index} isSelected={mySelectedIndex === index} name={layout.name} side={props.side} />;
        })}
    </div>;
}

function LayoutItem(props: AppProps & { index: number, name: string, isSelected: boolean, side: "left" | "right" }) {
    const myIndexName = props.side === "left" ? "selectedLayoutIndexLeft" : "selectedLayoutIndexRight";
    const { index, isSelected } = props;
    const onClick = useCallback(() => {
        updateProp("selectedSingleSide", props.side);
        updateProp(myIndexName, index);
        console.log(`set ${props.side}`);
        console.log(`set ${myIndexName} to ${index}`);
    }, [props, index]);
    return <div class={`layout ${isSelected ? "selected" : ""}`} onClick={onClick}>{props.name}</div>
}
