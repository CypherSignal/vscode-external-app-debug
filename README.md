# VS Code retrorom-debug Extension

This is an extension designed to facilitate development of homebrew patches and ROMs for "retro" game hardware, by providing integration with debug-protocol-aware emulators of such platforms.

## Using the retrorom-debug extension

* Install the **retrorom-debug** extension in VS Code.
* Go into VS Code's Settings, and under "Extensions > RetroROM Debug" set the emulator you want to launch your ROM with
* Switch to the Debug viewlet and press the gear dropdown.
* Select the debug environment "RetroROM Debug"
* Optionally, update the "program" part of the configuration to point to your generated ROM file
* Press the green 'play' button to start debugging

TODO: description of what you can do from here. Set breakpoints, step, run. What else?

## Build and Run

TODO: Set up a service that auto-builds the extension

* Clone the project
* Open the project folder in VS Code.
* Press `F5` to build and launch retrorom-debug in another VS Code window. In that window:
  * Open a folder containing a workspace with assembly for a ROM
  * Switch to the debug viewlet, and click Add Configuration (or the Configure gear icon)
  * Select the debug environment "RetroROM Debug"
  * Optionally, update the "program" part of the configuration to point to your generated ROM file
  * Press `F5` to start debugging

