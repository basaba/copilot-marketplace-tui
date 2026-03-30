#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.js";

const args = process.argv.slice(2);
const demoMode = args.includes("--demo");

render(React.createElement(App, { demoMode }), {
  exitOnCtrlC: true,
});
