import fs = require("fs/promises");
import express = require("express");
import esbuild = require("esbuild");
import path = require("node:path");
import controller = require("./print-controller");
import readline = require("readline");
import * as scriptRunner from "./script-runner";
import { Script, Layout, ServerState, LearnCommand, RunCommand } from '../../common/src/types';

readline.emitKeypressEvents(process.stdin);;
process.stdin.on("keypress", () => process.exit(0));

const repoRoot = path.join(__dirname, "../..");

const app = express();
app.use(express.json());
app.use(express.static(path.join(repoRoot, "ui")));

app.get('/app.js', (req, res) => {
    const value = esbuild.buildSync({
        entryPoints: [path.join(repoRoot, "client/src/index.tsx")],
        bundle: true,
        minify: false,
        write: false
    });
    if (value.outputFiles) {
        res.type(".js");
        res.send(value.outputFiles[0].text);
    } else {
        res.send("throw 'no output';");
    }
});

app.get('/status.json', (req, res) => {
    const pos = controller.getPosition();
    const response: ServerState = {
        homed: pos !== "unknown",
        x: pos === "unknown" ? -1 : pos.x,
        y: pos === "unknown" ? -1 : pos.y,
        z: pos === "unknown" ? -1 : pos.z,
    };
    res.send(response);
});

app.get('/position.json', (req, res) => {
    res.send(controller.getPosition());
});

app.get('/scripts.json', async (req, res) => {
    res.send(await getScripts());
});

app.get('/layouts.json', async (req, res) => {
    res.send(await getLayouts());
});

app.post("/learn", async (req, res) => {
    const cmd: LearnCommand = req.body;
    console.log(cmd);
    const layout = (await getLayouts()).filter(b => b.name === cmd.layout)[0];
    console.log(layout);
    layout.positions[cmd.side][cmd.position] = { x: cmd.x, y: cmd.y };
    writeLayout(layout);
    console.log("Done learning");
});

app.post("/tap", async (req, res) => {
    res.send({ result: await controller.tap() });
});

app.post("/motors-home", async (req, res) => {
    res.send({ result: await controller.home() });
});

app.post("/motors-off", async (req, res) => {
    res.send({ result: await controller.off() });
});

app.post("/info", async (req, res) => {
    res.send({ result: await controller.info() });
});

app.post("/move-absolute", async (req, res) => {
    res.send({ result: await controller.moveAbsolute(req.body) });
});

app.post("/move-relative", async (req, res) => {
    res.send({ result: await controller.moveRelative(req.body) });
});

app.post("/extrude", async (req, res) => {
    res.send({ result: await controller.extrude(req.body) });
});

app.post("/move-to-position", async (req, res) => {
    res.send({ result: await controller.moveToPosition(req.body) });
});

app.post("/stop", async (req, res) => {
    scriptRunner.stop();
    res.send({});
});

app.post("/load", async (req, res) => {
    await controller.load();
    res.send({});
});

app.post("/run", async (req, res) => {
    const cmd: RunCommand = req.body;
    const script = (await getScripts()).filter(s => s.name === cmd.script)[0];
    const layoutLeft = (await getLayouts()).filter(s => s.name === cmd.layoutLeft)[0];
    const layoutRight = (await getLayouts()).filter(s => s.name === cmd.layoutRight)[0];
    const info = await controller.getPosition();
    if (info === "unknown") {
        await controller.home();
    }
    debugger;
    scriptRunner.runScript(script, layoutLeft, layoutRight);
    res.send({});
});

app.listen(8090);
console.log("Server running at https://localhost:8090");

async function getScripts(): Promise<Script[]> {
    const scripts = path.join(repoRoot, "scripts");
    const files = await fs.readdir(scripts);
    const result: any[] = [];
    for (const f of files) {
        result.push(JSON.parse(await fs.readFile(path.join(scripts, f), 'utf-8')));
    }
    return result;
}

async function getLayouts(): Promise<Layout[]> {
    const layoutRoot = path.join(repoRoot, "layouts");
    const files = await fs.readdir(layoutRoot);
    const result: any[] = [];
    for (const f of files) {
        const body = JSON.parse(await fs.readFile(path.join(layoutRoot, f), 'utf-8'));
        body._filename = f;
        result.push(body);
    }
    return result;
}

async function writeLayout(body: Layout) {
    const target = path.join(repoRoot, "layouts", body._filename);
    body._filename = null as never;
    await fs.writeFile(target, JSON.stringify(body, undefined, 2), "utf-8");
}