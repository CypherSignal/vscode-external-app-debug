import * as net from 'net';
import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, CancellationToken, ProviderResult } from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.external-app-debug.getFileLocation', config => {
		return vscode.window.showInputBox({
			placeHolder: "Specify the name of an file in the workspace folder for the application to execute"
		});
	}));

	// register a configuration provider for external-app-debug
	const provider = new ExternalAppDebugConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('external-app-debug', provider));
	context.subscriptions.push(provider);

	// register an adapter descriptor for external-app-debug
	const factory = new ExternalAppDebugAdapterDescriptorFactory();
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('external-app-debug', factory));
	context.subscriptions.push(factory);
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

function getExternalAppLocation() : string {
	return vscode.workspace.getConfiguration('external-app-debug').get<string>('externalAppPath') ||
			(vscode.window.showErrorMessage("external-app-debug externalAppPath setting not configured."), "");
}

// generate an array of promises that each (attempt) to establish a connection on the given port,
// and once connection is made, send down a custom "debug-adapter"-style json request
// then wait for the response to fill out the data
//
// Sample version of the ExternalAppDebugPreInit Request:
//
// export interface ExternalAppDebugPreInitRequest extends Request {
// 	// command: 'external-apppreinit';
// }
//
// Sample version of the ExternalAppDebugPreInit response that should be filled out by the target executable
//
// 	export interface ExternalAppDebugPreInitResponse extends Response {
// 		// Information for this debug adapter
// 		body: {
// 			pid: Number; // The process ID of the executable
// 			title: String; // The title to display on the picker, for selecting executable to attach to
// 			description: String; // An extended description of what to attach to
//	 	}
// 	}
async function getListeningProcesses() : Promise<PortItem[]> {
	let portscanResults = new Array<Promise<PortItem | undefined>>();
	for (let i = 5420; i < 5450; i++) {
		portscanResults.push(new Promise((resolve, reject) => {
			let socket = net.createConnection({port : i}, () => {
					// after creating the connection, send a "preinit" request message
					// and get the response to fill out the PortItem data
					const request: any = {
						command: "external-apppreinit",
						type: "request",
						seq: 0
					};
					const requestJson = JSON.stringify(request);
					socket.write(`Content-Length: ${Buffer.byteLength(requestJson, 'utf8')}\r\n\r\n${requestJson}`, 'utf8');
				})
				.on('data', (data: Buffer) => {
					const lines = data.toString('utf8').split(/\r?\n/);
					if (lines.length === 4) {
						const content = JSON.parse(lines[2]);
						if (content.command === "external-apppreinit") {
							if (content.body !== undefined) {
								resolve(new PortItem(i, content.body.pid, (content.body.title || `Port: ${i}`) + ` | PID: ${content.body.pid}`, content.body.description));
							}
							else {
								resolve(new PortItem(i));
							}
							socket.end();
							return;
						}
					}
					resolve(undefined);
					socket.end();
				})
				.on('error', () => { resolve(undefined); socket.destroy(); })
				.on('timeout', () => { resolve(undefined); socket.destroy(); })
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
			await new Promise( _ => setTimeout(_, 100));
		}
	}
	return undefined;
}

class ExternalAppDebugConfigurationProvider implements vscode.DebugConfigurationProvider {

	// Massage a debug configuration just before a debug session is being launched,
	// e.g. throw out the program name if we're doing an attach
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		if (config.request === "attach") {
			config.program = "";
		}
		return config;
	}

	dispose() {	}
}

// factory that generates the DebugAdapterServer after finalizing the debug configuration
class ExternalAppDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory  {

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
		let portPromise:Thenable<PortItem | undefined>;

		if (session.configuration.request === "launch") {
			// launch the process to attach to
			const process = child_process.spawn(getExternalAppLocation());

			// start portscan to find the process to connect to, and do so
			portPromise = getListenerPortForProcess(process.pid)
		}
		else if (session.configuration.request === "attach") {
			// do a portscan and use that to populate a picker
			portPromise = vscode.window.showQuickPick(getListeningProcesses());
		}
		else {
			portPromise = new Promise(() => { return undefined; });
		}

		// convert the promised PortItem into a debugAdapterServer
		return portPromise.then(result => {
			if (result) {
				return new vscode.DebugAdapterServer(result.port);
			}
			return undefined;
		});
	}

	dispose() {	}
}