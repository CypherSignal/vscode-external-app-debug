

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, CancellationToken, ProviderResult } from 'vscode';

export function activate(context: vscode.ExtensionContext)
{
	context.subscriptions.push(vscode.commands.registerCommand('extension.retrorom-debug.getRomLocation', config =>
	{
		return vscode.window.showInputBox({
			placeHolder: "Specify the name of an assembled ROM file in the workspace folder to execute"
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.retrorom-debug.getEmulatorLocation', _ =>
	{
		let emulatorPathConfig = vscode.workspace.getConfiguration('retrorom-debug');
		if (!emulatorPathConfig.has('emulatorPath') || emulatorPathConfig.get<string>('emulatorPath') === "")
		{
			vscode.window.showErrorMessage("retrorom-debug emulatorPath setting not configured.");
			return {};
		}
		else
		{
			return {command:emulatorPathConfig.get<string>('emulatorPath'), args: []};
		}
	}));

	// register a configuration provider for retrorom-debug
	const provider = new RetroROMDebugConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('retrorom-debug', provider));
	context.subscriptions.push(provider);
}


class RetroROMDebugConfigurationProvider implements vscode.DebugConfigurationProvider
{
	// Massage a debug configuration just before a debug session is being launched,
	// e.g. add all missing attributes to the debug configuration.
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration>
	{
		return config;
	}

	dispose() {	}
}