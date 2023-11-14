import * as React from 'preact';
import { useCallback } from "preact/hooks";
import type { AppProps } from ".";

export function Joystick(props: AppProps) {
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

