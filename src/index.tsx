#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.js";

// Enter alternate screen buffer (like vim, less, etc.)
process.stdout.write("\x1b[?1049h");
process.stdout.write("\x1b[H"); // Move cursor to top-left

const instance = render(React.createElement(App), {
  exitOnCtrlC: true,
});

// Restore normal screen on exit
function cleanup() {
  process.stdout.write("\x1b[?1049l");
}

instance.waitUntilExit().then(cleanup);
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
