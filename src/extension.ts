

`use strict`;

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, CancellationToken, ProviderResult } from 'vscode';
//import { DebugAdapterExecutable } from 'vscode';

export function activate(context: vscode.ExtensionContext)
{
	context.subscriptions.push(vscode.commands.registerCommand('extension.snes-dev-debug.getRomLocation', config =>
	{
		return vscode.window.showInputBox({
			placeHolder: "Specify the name of an assembled ROM file in the workspace folder to execute"
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.snes-dev-debug.getEmulatorLocation', _ =>
	{
		let emulatorPathConfig = vscode.workspace.getConfiguration('snes-dev-debug');
		if (!emulatorPathConfig.has('emulatorPath') || emulatorPathConfig.get<string>('emulatorPath') == "")
		{
			return vscode.window.showOpenDialog({ canSelectFolders:false, canSelectMany: false, openLabel:'Select'}).then(fileUri =>
				{
					if (fileUri && fileUri[0])
					{
						vscode.workspace.getConfiguration('snes-dev-debug').update('emulatorPath', fileUri[0].fsPath, false);

						return fileUri[0].fsPath;
					}
					return "";
				}).then(fsPath => {
					return {command:fsPath, args:[]};
				});
		}
		else
		{
			return {command:emulatorPathConfig.get<string>('emulatorPath'), args: []};
		}
	}));

	// TODO Forget all of the adapterExecutable stuff. It's a total no-go.
	// SET UP OUR OWN DEBUGADAPTER and run that through js.
	// have that relay responses and requests, instead of debugging through vscode.

	// register a configuration provider for 'mock' debug type
	const provider = new SnesDebugConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('snes-dev-debug', provider));
	context.subscriptions.push(provider);
}


class SnesDebugConfigurationProvider implements vscode.DebugConfigurationProvider
{
	// Massage a debug configuration just before a debug session is being launched,
	// e.g. add all missing attributes to the debug configuration.
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration>
	{
		return config;
	}

	// TODO: Need to switch over to using this API to provide debugAdapterExecutable once hte appropriate hook is no longer "proposed"
	// also remove adapterExecutableCommand from package.json
	// debugAdapterExecutable(folder: WorkspaceFolder | undefined, token?: CancellationToken): ProviderResult<DebugAdapterExecutable>
	// {

	// }

	dispose() {	}
}