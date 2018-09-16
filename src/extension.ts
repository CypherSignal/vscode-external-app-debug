

`use strict`;

import * as vscode from 'vscode';
import { WorkspaceFolder } from 'vscode';

export function activate(context: vscode.ExtensionContext)
{
	context.subscriptions.push(vscode.commands.registerCommand('extension.snes-dev-debug.getRomLocation', config => {
		return vscode.window.showInputBox({
			placeHolder: "Specify the name of an assembled ROM file in the workspace folder to execute"
		});
	}));

	// TODO:
	// Find a way to configure what the emulator location is
	// Can we pop a file-picker dialog here if a config setting is not set, and set it then?
	// Can we specify the program via command line?
}
