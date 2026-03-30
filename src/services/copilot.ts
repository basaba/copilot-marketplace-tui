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

// Parse "copilot plugin list" output:
//   Installed plugins:
//     • workiq@copilot-plugins (v1.0.0)
//     • docker@awesome-copilot (v2.0.0) [disabled]
export function listInstalled(): InstalledPlugin[] {
  const out = run("copilot plugin list");
  if (!out) return [];
  const plugins: InstalledPlugin[] = [];
  for (const line of out.split("\n")) {
    // Match: • name@marketplace (vX.Y.Z) [optional status]
    const match = line.match(/•\s+(\S+?)@(\S+)\s+\(v?([\d.]+)\)(?:\s+\[(\w+)\])?/);
    if (match) {
      const [, name, marketplace, version, status] = match;
      plugins.push({
        name: name!,
        version: version!,
        enabled: status !== "disabled",
        marketplace: marketplace!,
        updateAvailable: false,
      });
    }
  }
  return plugins;
}

// Parse "copilot plugin marketplace list" output:
//   ✨ Included with GitHub Copilot:
//     ◆ copilot-plugins (GitHub: github/copilot-plugins)
//     ◆ awesome-copilot (GitHub: github/awesome-copilot)
//   📦 User-added:
//     ◆ my-marketplace (GitHub: user/my-marketplace)
export function listMarketplaces(): Marketplace[] {
  const out = run("copilot plugin marketplace list");
  if (!out) return [];
  const marketplaces: Marketplace[] = [];
  for (const line of out.split("\n")) {
    const match = line.match(/◆\s+(\S+)\s+\(GitHub:\s+(\S+)\)/);
    if (match) {
      const [, name, repo] = match;
      marketplaces.push({
        name: name!,
        url: `https://github.com/${repo}`,
      });
    }
  }
  return marketplaces;
}

// Parse "copilot plugin marketplace browse <name>" output:
//   Plugins in "copilot-plugins":
//     • workiq - WorkIQ plugin for GitHub Copilot.
//     • spark - Spark plugin for GitHub Copilot.
export function browseMarketplace(
  name: string,
  installedNames: Set<string>
): MarketplacePlugin[] {
  const out = run(`copilot plugin marketplace browse ${name}`);
  if (!out) return [];
  const plugins: MarketplacePlugin[] = [];
  for (const line of out.split("\n")) {
    const match = line.match(/•\s+(\S+)\s+-\s+(.*)/);
    if (match) {
      const [, pluginName, description] = match;
      plugins.push({
        name: pluginName!,
        description: description!.trim(),
        version: "",
        installed: installedNames.has(pluginName!),
        marketplace: name,
      });
    }
  }
  return plugins;
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
