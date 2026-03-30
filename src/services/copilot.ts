import { execSync } from "node:child_process";
import type {
  InstalledPlugin,
  MarketplacePlugin,
  Marketplace,
} from "../types.js";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
  } catch {
    return "";
  }
}

export function listInstalled(): InstalledPlugin[] {
  const out = run("copilot plugin list --json");
  if (!out) return [];
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export function listMarketplaces(): Marketplace[] {
  const out = run("copilot plugin marketplace list --json");
  if (!out) return [];
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export function browseMarketplace(name: string): MarketplacePlugin[] {
  const out = run(`copilot plugin marketplace browse ${name} --json`);
  if (!out) return [];
  try {
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export function installPlugin(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin install ${name}`);
    return { success: true, message: out || `✓ Installed ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Install failed: ${e}` };
  }
}

export function uninstallPlugin(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin uninstall ${name}`);
    return { success: true, message: out || `✓ Uninstalled ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Uninstall failed: ${e}` };
  }
}

export function enablePlugin(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin enable ${name}`);
    return { success: true, message: out || `✓ Enabled ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Enable failed: ${e}` };
  }
}

export function disablePlugin(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin disable ${name}`);
    return { success: true, message: out || `✓ Disabled ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Disable failed: ${e}` };
  }
}

export function updatePlugin(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin update ${name}`);
    return { success: true, message: out || `✓ Updated ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Update failed: ${e}` };
  }
}

export function addMarketplace(spec: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin marketplace add ${spec}`);
    return { success: true, message: out || `✓ Added marketplace ${spec}` };
  } catch (e) {
    return { success: false, message: `✗ Add marketplace failed: ${e}` };
  }
}

export function removeMarketplace(name: string): { success: boolean; message: string } {
  try {
    const out = run(`copilot plugin marketplace remove ${name}`);
    return { success: true, message: out || `✓ Removed marketplace ${name}` };
  } catch (e) {
    return { success: false, message: `✗ Remove marketplace failed: ${e}` };
  }
}
