# VS Code retrorom-debug Extension

This is an extension designed to facilitate development of homebrew patches and ROMs for "retro" game hardware, by providing integration with debug-protocol-aware emulators of such platforms.

## Using the retrorom-debug extension

* Install the **retrorom-debug** extension in VS Code
* In VS Code's Preferences, under "Extensions > RetroROM Debug", set the emulator you want to launch your ROM with
* In the Debug viewlet, click the dropdown to "Add Configuration..." and select "RetroROM Debug" to create a debug configuration in your launch.json
	* Note that `launch` and `attach` request types are available in the extension
	* Other settings such as `stopAtEntry` and `program` must be acknowledged by the target emulator

From there, VS Code should launch the emulator you provided, and establish a connection with it. Functionality from that point forward is handled by the emulator, including systems such as loading of symbols, controlling execution, fetching runtime state, and so on.

## Information for emulator authors

If you are the maintainer of an emulator and you want it to work with this extension as a debug target, note the following:

When running the `launch` request, your program will be launched as a new process, and the extension will do a portscan from ports 5420 to 5450 looking for the process in question, by attempting to create Tcp Connections at each port. Your program should run a Tcp Server in this port range, listening for connections. If the extension successfully makes a connection with your program, a custom Request, with the command `retrorompreinit`, is sent, similar to normal Requests fired as part of the Debug Adapter Protocol. A Response must be provided, filling out your program's `pid` (Process ID). Once your program's Response is received, the connection that was created for the portscan will be closed, and the port your program was discovered on will be passed to VS Code. VS Code which will then open a new connection on the same port that your process was discovered on, and perform normal Debug Adapter Protocol activities.

When running the `attach` request, some similar behaviour will occur. Of course, your program will not be launched, but a portscan over the same set of ports as above will be performed. the `retrorompreinit` request will also be fired, but in addition to your program's pid, you should also fill out the `title` and `description` of the body. The extension will enumerate all respondees to the `retrorompreinit` request, and display the `title` and `description` for the user in a Picker. It is recommended for the `title` to be your program's name, and `description` to be the name of the ROM currently loaded, if any.

If the `retrorompreinit` request was included in the Debug Adapter Protocol, it would resemble this definition:

```
export interface RetroRomPreInitRequest extends Request {
 	// command: 'retrorompreinit';
}

export interface RetroRomPreInitResponse extends Response {
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
