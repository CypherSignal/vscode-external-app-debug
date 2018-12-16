import * as net from 'net';
import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, CancellationToken, ProviderResult } from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.retrorom-debug.getRomLocation', config => {
		return vscode.window.showInputBox({
			placeHolder: "Specify the name of an assembled ROM file in the workspace folder to execute"
		});
	}));

	// register a configuration provider for retrorom-debug
	const provider = new RetroROMDebugConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('retrorom-debug', provider));
	context.subscriptions.push(provider);
}

class PortItem implements vscode.QuickPickItem {
	port: number;
	pid: number;
	label: string;
	description: string;
	constructor(port:number, pid = 0, label = "", description = "") {
		this.port = port;
		this.pid = pid;
		this.label = label;
		this.description = description;
	}
}

function getEmulatorLocation() : string {
	return vscode.workspace.getConfiguration('retrorom-debug').get<string>('emulatorPath') ||
			(vscode.window.showErrorMessage("retrorom-debug emulatorPath setting not configured."), "");
}

// dcrooks-todo more configuration of the target port range
// dcrooks-todo update readme with this data
// generate an array of promises that each (attempt) to establish a connection on the given port,
// and once connection is made, send down a custom "debug-adapter"-style json request
// then wait for the response to fill out the data
//
// Sample version of the RetroRomPreInit Request:
//
// export interface RetroRomPreInitRequest extends Request {
// 	// command: 'retrorompreinit';
// }
//
// Sample version of the RetroRomPreInit response that should be filled out by the target executable
//
// 	export interface RetroRomPreInitResponse extends Response {
// 		// Information for this debug adapter
// 		body: {
// 			pid: Number; // The process ID of the executable
// 			title: String; // The title to display on the picker, for selecting executable to attach to
// 			description: String; // An extended description of what to attach to
//	 	}
// 	}
async function getListeningProcesses() : Promise<PortItem[]> {
	let portscanResults = new Array<Promise<PortItem | undefined>>();
	for (let i = 5422; i < 5422 + 50; i++) {
		portscanResults.push(new Promise((resolve, reject) => {
			let socket = net.createConnection({port : i}, () => {
					// after creating the connection, send a "preinit" request message
					// and get the response to fill out the PortItem data
					const request: any = {
						command: "retrorompreinit",
						type: "request",
						seq: 0
					};
					const requestJson = JSON.stringify(request);
					socket.write(`Content-Length: ${Buffer.byteLength(requestJson, 'utf8')}\r\n\r\n${requestJson}`, 'utf8');
				})
				.on('data', (data: Buffer) => {
					// dcrooks-todo this handling sucks.
					// We should at least pretend to ack the "content-length" in the response...
					const lines = data.toString('utf8').split(/\r?\n/);
					if (lines.length === 4) {
						const content = JSON.parse(lines[2]);
						if (content.command === "retrorompreinit") {
							if (content.body !== undefined) {
								resolve(new PortItem(i, content.body.pid, content.body.title || `Port: ${i}`, content.body.description));
							}
							else {
								resolve(new PortItem(i));
							}
							return;
						}
					}
					resolve(undefined);
				})
				.on('error', () => { resolve(undefined); })
				.on('timeout', () => { resolve(undefined); })
				.setTimeout(150);
		}));
	}
	return Promise.all(portscanResults).then(results => results.filter(item => item !== undefined) as PortItem[]);
}

// Repeatedly does a portscan for an executable matching the given ProcessId for a few seconds
async function getListenerPortForProcess(pid:number) : Promise<PortItem | undefined> {
	const endTimeout = new Date().getTime() + 5000;
	while (new Date().getTime() < endTimeout) {
		const resultPromise = await getListeningProcesses().then(items => items.find(item => item.pid === pid));
		if (resultPromise) {
			return resultPromise;
		}
		else { // do a short wait to we don't spam constantly
			await new Promise( _ => setTimeout(_, 50));
		}
	}
	return undefined;
}

class RetroROMDebugConfigurationProvider implements vscode.DebugConfigurationProvider {

	// Massage a debug configuration just before a debug session is being launched,
	// e.g. add all missing attributes to the debug configuration.
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		if (config.request === "launch") {
			// kick process
			const emulatorProc = child_process.spawn(getEmulatorLocation());
			// start portscan to find the process to connect to, and do so
			return getListenerPortForProcess(emulatorProc.pid).then(result => {
				if (result) {
					config.debugServer = result.port;
					return config;
				}
				return undefined;
			});
		}
		else if (config.request === "attach") {
			return vscode.window.showQuickPick(getListeningProcesses().then(items => items.filter(item => item.port !== 0))).then(result => {
				if (result) {
					config.debugServer = result.port;
					return config;
				}
				return undefined;
			});
		}
	}

	dispose() {	}
}