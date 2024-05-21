import serialport = require("serialport");

const initializationSequence: ReadonlyArray<string> = [
    "M107", // Fan off
    "M302 P1", // Cold extrude OK
    "G90", // Absolute positioning
    "M83", // Relative extruder positioning
    "M203 E500 X2500 Y2500 Z2500", // High max speeds
];

export async function findPrinter(): Promise<string | null> {
    const ports = await serialport.SerialPort.list();
    let result: string | null = null;
    for (const p of ports.filter(p => p.path === process.env["PORT_NAME"])) {
        console.log(p);
        try {
            const port = new serialport.SerialPort({ path: p.path, baudRate: 115200, hupcl: true });
            let foundIt: (value: unknown) => void;
            const foundItPromise = new Promise(res => foundIt = res);
            port.on("data", data => {
                const res = data.toString("utf8");
                if (res.trim() === "ok") {
                    result = p.path;
                    foundIt(undefined);
                }
            });
            // "Finish moves" (no-op for idle printer)
            port.write("M400\n");
            await Promise.race([wait(500), foundItPromise])
            port.close();
        } catch (e) {
            console.log(e);
        }
    }
    return result;
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export type Port = Awaited<ReturnType<typeof getSerialPort>>;
export async function getSerialPort() {
    let resolveCommandReponse: (s: string) => void = sentinelResponse;

    const path = await findPrinter();
    if (path === null) return null;

    const port = new serialport.SerialPort({ path, baudRate: 115200 });
    // Flush any stale data
    await new Promise(res => port.flush(res));

    // Start listening for output
    let pendingData = "";
    port.on("data", data => {
        const chunk = data.toString('utf8');
        pendingData = pendingData + chunk;
        if (pendingData.endsWith("ok\n")) {
            resolveCommandReponse(pendingData);
            pendingData = "";
        } else {
            console.log(`RAW PENDING COMPLETION: ${pendingData}`);
        }
    });

    // Send out the init sequence
    for (const c of initializationSequence) {
        await writeCommands(c);
    }

    return ({
        writeCommands,
        writeCommand,
        getResponse
    });

    async function getResponse() {
        const res = pendingData;
        pendingData = "";
        return res;
    }

    async function writeCommand(command: string): Promise<string> {
        const gotResponse = new Promise<string>(res => resolveCommandReponse = res);
        console.log(`WRITE: ${command}`);
        port.write(command + '\n');
        await port.drain();
        const result = await gotResponse;
        console.log(`RESPONSE: ${result}`);
        resolveCommandReponse = sentinelResponse;
        return result;
    }

    async function writeCommands(...commands: string[]): Promise<void> {
        for (const c of commands) {
            await writeCommand(c);
        }
    }

    function sentinelResponse(s: string) {
        console.log(`UNEXPECTED RESPONSE: ${s}`);
    }
}

async function main() {
    const port = new serialport.SerialPort({ path: "COM3", baudRate: 115200 });
    port.on("data", d => {
        console.log(d.toString('utf8'));
    });
    port.open(() => {
        // Fan off
        port.write("M107\n");
        // Enable cold extrude
        port.write("M302 P1\n");
        // Absolute positioning
        port.write("G90\n");
        // Relative extruder positioning
        port.write("M83\n");

        // Extruder out at high feed rate
        port.write("G0 E3 F8000\n");
        // Dwell 200ms
        // port.write("G4 P200\n");
        // Extruder in at high feed rate
        port.write("G0 E-3 F8000\n");

        // Disable steppers
        port.write("M18");
    });


}

// main();

