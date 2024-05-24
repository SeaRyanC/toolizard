import * as React from 'preact';
import { useCallback } from "preact/hooks";
import type { AppProps } from ".";

export function Joystick(props: AppProps) {
    const move = useCallback((axis: "x" | "y" | "z" | "e", distance: number) => () => props.events.move(axis, distance), [props.events.move]);
    const home = useCallback(() => props.events.home(), [props.events.home]);
    const tap = useCallback(() => props.events.tap(), [props.events.tap]);

    let pos: string | null = null;
    let z: string | null = null;
    if (props.serverState.x !== -1) {
        pos = `${props.serverState.x}, ${props.serverState.y}`;
        z = props.serverState.z.toString();
    } else {
        pos = "?, ?";
    }

    return <table class="joystick">
        <tr>
            <td><Button onClick={props.events.off}>Hush</Button></td>
            <td></td>
            <td><Button onClick={move("y", 10)}>▲</Button></td>
            <td>{pos}</td>
            <td><Button critical={!props.serverState.homed} onClick={home}>Home</Button></td>
        </tr>
        <tr>
            <td><Button small onClick={props.events.refresh}>⟳</Button></td>
            <td><Button small onClick={move("e", -0.5)}>e-</Button></td>
            <td><Button onClick={move("y", 1)}>▲</Button></td>
            <td><Button small onClick={move("z", 1)}>z+</Button></td>
            <td>{z}</td>
            <td></td>
        </tr>
        <tr>
            <td><Button onClick={move("x", -10)}>◀</Button></td>
            <td><Button onClick={move("x", -1)}>◀</Button></td>
            <td><Button onClick={tap}>Tap</Button></td>
            <td><Button onClick={move("x", 1)}>▶</Button></td>
            <td><Button onClick={move("x", 10)}>▶</Button></td>
        </tr>
        <tr>
            <td></td>
            <td><Button small onClick={move("e", 0.5)}>e+</Button></td>
            <td><Button onClick={move("y", -1)}>▼</Button></td>
            <td><Button small onClick={move("z", -1)}>z-</Button></td>
            <td></td>
        </tr>
        <tr>
            <td><Button onClick={props.events.stop}>HALT</Button></td>
            <td></td>
            <td><Button onClick={move("y", -10)}>▼</Button></td>
            <td></td>
            <td><Button onClick={props.events.load}>Load</Button></td>
        </tr>
    </table>
}

type ButtonProps = {
    onClick: () => void;
    critical?: boolean;
    small?: boolean;
    children: any;
}
function Button(props: ButtonProps) {
    return <button class={props.small ? "small" : props.critical ? "critical" : ""} onClick={props.onClick}>{...props.children}</button>;
}

