# VS Code RetroROM-debug Extension

This is an extension designed to facilitate development of homebrew patches and ROMs for "retro" game hardware, by providing integration with debug-protocol-aware emulators of such platforms.

## Using the RetroROM-debug extension

* Install the **RetroROM-debug** extension in VS Code.
TODO: will need a build step (should this only be discussed?)
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "ROM Debug".
* Press the green 'play' button to start debugging.

TODO: description of what you can do from here. Set breakpoints, step, run. What else?

## Build and Run

TODO: Set up a service that auto-builds the extension

* Clone the project
* Open the project folder in VS Code.
* Press `F5` to build and launch RetroROM-debug in another VS Code window. In that window:
  * Open a folder containing a workspace with assembly for a ROM
  * Switch to the debug viewlet and press the gear dropdown.
  * Select the debug environment "RetroROM Debug".
  * Press `F5` to start debugging.

