# VS Code retrorom-debug Extension

This is an extension designed to facilitate development of homebrew patches and ROMs for "retro" game hardware, by providing integration with debug-protocol-aware emulators of such platforms.

## Using the retrorom-debug extension

* Install the **retrorom-debug** extension in VS Code
* Go into VS Code's Settings, and under "Extensions > RetroROM Debug" set the emulator you want to launch your ROM with
* Switch to the Debug viewlet and press the gear dropdown
* Select the debug environment "RetroROM Debug"
* Optionally, update the "program" part of the configuration to point to your generated ROM file
* Press the green 'play' button to start debugging

## Build and run

* Clone the project
* Open the project folder in VS Code
* Run `npm install` on the commmand line
* Press `F5` to build and launch retrorom-debug in another VS Code window. In that window:
  * Open a folder containing a workspace with assembly for a ROM
  * Switch to the debug viewlet, and click Add Configuration (or the Configure gear icon)
  * Select the debug environment "RetroROM Debug"
  * Optionally, update the "program" part of the configuration to point to your generated ROM file
  * Press `F5` to start debugging

## Information for emulator authors

If you are the maintainer of an emulator and you want it to work with this extension as a debug target, note the following:

When running the `launch` request, your program will be launched as a new process, and the extension will do a portscan from ports 5422 to 5476 looking for the process in question, by attempting to create Tcp Connections at each port. Your program should run a Tcp Server in this port range, listening for connections. If the extension successfully makes a connection with your program, a custom Request, with the command `retrorompreinit`, is sent, similar to normal Requests fired as part of the Debug Adapter Protocol. A Response must be provided, filling out your program's `pid` (Process ID). Once your program's Response is received, the connection that was created for the portscan will be closed, and the port your program was discovered on will be passed to VS Code. VS Code which will then open a new connection on the same port that your process was discovered on, and perform normal Debug Adapter Protocol activities.

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

Aside from that, all interactions with the Debug Adapter Protocol are unchanged. Information on this protocol can be found at https://microsoft.github.io/debug-adapter-protocol/overview. In your own development, if setting up Servers and Sockets is particularly onerous, it might be recommended to start with having your program listen on stdin/stdout. The extension can be modified by removing the behaviour of `ResolveDebugConfiguration` that sets `config.debugServer`, and by adding `"adapterExecutableCommand": "extension.retrorom-debug.getEmulatorLocation"` as a feature of the `debuggers` contribution in the `package.json` file.