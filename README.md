# VS Code external-app-debug Extension

This is an extension designed to facilitate development of content that is executed inside of external applications, by providing integration with debug-protocol-aware applications

## Using the external-app-debug extension

* Install the **external-app-debug** extension in VS Code
* In VS Code's Preferences, under "Extensions > External-App Debug", set the application you want to launch
* In the Debug viewlet, click the dropdown to "Add Configuration..." and select "External-App Debug" to create a debug configuration in your launch.json
	* Note that `launch` and `attach` request types are available in the extension
	* Other settings such as `stopAtEntry` and `program` must be acknowledged by the target application

From there, VS Code should launch the  you provided, and establish a connection with it. Functionality from that point forward is handled by the application, including systems such as loading of symbols, controlling execution, fetching runtime state, and so on.

An example of a supported application (itself a WIP) is available at https://github.com/CypherSignal/bsnes-plus/tree/vscode-newdbg

## Information for application authors

If you are the maintainer of an application and you want it to work with this extension as a debug target, note the following:

When running the `launch` request, your application will be launched as a new process, and the extension will do a portscan from ports 5420 to 5450 looking for the process in question, by attempting to create Tcp Connections at each port. Your application should run a Tcp Server in this port range, listening for connections. If the extension successfully makes a connection with your application, a custom Request, with the command `external-apppreinit`, is sent, similar to normal Requests fired as part of the Debug Adapter Protocol. A Response must be provided, filling out your application's `pid` (Process ID). Once your application's Response is received, the connection that was created for the portscan will be closed, and the port your application was discovered on will be passed to VS Code. VS Code which will then open a new connection on the same port that your process was discovered on, and perform normal Debug Adapter Protocol activities.

When running the `attach` request, some similar behaviour will occur. Of course, your application will not be launched, but a portscan over the same set of ports as above will be performed. the `external-apppreinit` request will also be fired, but in addition to your application's pid, you should also fill out the `title` and `description` of the body. The extension will enumerate all respondees to the `external-apppreinit` request, and display the `title` and `description` for the user in a Picker. It is recommended for the `title` to be your application's name, and `description` to be the name of the script or sub-program currently loaded, if any.

If the `external-apppreinit` request was included in the Debug Adapter Protocol, it would resemble this definition:

```
export interface external-appPreInitRequest extends Request {
 	// command: 'external-apppreinit';
}

export interface external-appPreInitResponse extends Response {
	// Information for this debug adapter
	body: {
		pid: Number; // The process ID of the executable
		title: String; // The title to display on the picker, for selecting executable to attach to
		description: String; // An extended description of what to attach to
	}
}
```

Aside from that, all interactions with the Debug Adapter Protocol are unchanged. Information on this protocol can be found at https://microsoft.github.io/debug-adapter-protocol/overview.


## Build and run the extension yourself

* Clone the project, and open the project folder in VS Code
* Run `npm install` in the terminal
* Run the "Extension" debug configuration
