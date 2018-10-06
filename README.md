# VS Code Snes-Dev Extension

This is an extension designed to facilitate development of SNES patches and ROMs, by providing syntax highlighting for 65816 assembly, and ease of integration with debug-protocol-aware emulators.

## Using the Snes-dev extension

* Install the **Snes-dev** extension in VS Code.
TODO: will need a configuration point to refer to an emulator to utilize
TODO: will need a build step (should this only be discussed?)
* Switch to the debug viewlet and press the gear dropdown.
* Select the debug environment "Snes Debug".
* Press the green 'play' button to start debugging.

TODO: description of what you can do from here. Set breakpoints, step, run. What else?

## Build and Run

TODO: Set up a service that auto-builds the extension

* Clone the project TODO: link to this git repo
* Open the project folder in VS Code.
* Press `F5` to build and launch Snes-Dev in another VS Code window. In that window:
  * Open a folder containing a SNES assembly workspace
  * Switch to the debug viewlet and press the gear dropdown.
  * Select the debug environment "Snes Debug".
  * Press `F5` to start debugging.

## Credits

Initial implementation of 65816 TextMarkup language provided via DanielOaks: https://github.com/DanielOaks/65816-Assembly-TMlanguage