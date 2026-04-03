import { execSync, exec } from "node:child_process";
function run(cmd) {
    try {
        return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
    }
    catch {
        return "";
    }
}
function runAsync(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { encoding: "utf-8", timeout: 30000 }, (err, stdout) => {
            if (err)
                reject(err);
            else
                resolve((stdout || "").trim());
        });
    });
}
function ghApi(endpoint, jq) {
    const jqArg = jq ? ` --jq '${jq}'` : "";
    return runAsync(`gh api ${endpoint}${jqArg}`);
}
/** Extract owner/repo from a marketplace URL like https://github.com/owner/repo */
function repoFromUrl(url) {
    const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1] : null;
}
// Parse "copilot plugin list" output:
//   Installed plugins:
//     • workiq@copilot-plugins (v1.0.0)
//     • docker@awesome-copilot (v2.0.0) [disabled]
export function listInstalled() {
    const out = run("copilot plugin list");
    return parseInstalled(out);
}
export async function listInstalledAsync() {
    const out = await runAsync("copilot plugin list");
    return parseInstalled(out);
}
function parseInstalled(out) {
    if (!out)
        return [];
    const plugins = [];
    for (const line of out.split("\n")) {
        const match = line.match(/•\s+(\S+?)@(\S+)\s+\(v?([\d.]+)\)(?:\s+\[(\w+)\])?/);
        if (match) {
            const [, name, marketplace, version, status] = match;
            plugins.push({
                name: name,
                version: version,
                enabled: status !== "disabled",
                marketplace: marketplace,
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
export function listMarketplaces() {
    const out = run("copilot plugin marketplace list");
    return parseMarketplaces(out);
}
export async function listMarketplacesAsync() {
    const out = await runAsync("copilot plugin marketplace list");
    return parseMarketplaces(out);
}
function parseMarketplaces(out) {
    if (!out)
        return [];
    const marketplaces = [];
    for (const line of out.split("\n")) {
        const match = line.match(/[◆•]\s+(\S+)\s+\(GitHub:\s+(\S+)\)/);
        if (match) {
            const [, name, repo] = match;
            marketplaces.push({
                name: name,
                url: `https://github.com/${repo}`,
            });
        }
    }
    return marketplaces;
}
// Browse marketplace plugins via gh API, falling back to copilot CLI.
// Phase 1: fetch plugin names instantly via Git Trees API (single call).
// Phase 2: caller can backfill descriptions via fetchDescriptionsAsync.
export async function browseMarketplaceAsync(name, installedNames, url) {
    if (url) {
        try {
            return await browseViaGhApi(name, url, installedNames);
        }
        catch {
            // fall through to CLI
        }
    }
    const out = await runAsync(`copilot plugin marketplace browse ${name}`);
    return parseBrowse(out, name, installedNames);
}
/** Backfill descriptions using copilot CLI (returns full name+desc list). */
export async function fetchDescriptionsAsync(name, installedNames) {
    const out = await runAsync(`copilot plugin marketplace browse ${name}`);
    return parseBrowse(out, name, installedNames);
}
async function browseViaGhApi(marketplace, url, installedNames) {
    const repo = repoFromUrl(url);
    if (!repo)
        throw new Error("Cannot extract repo from URL");
    // Single API call: get the full repo tree and extract plugin directory names
    const raw = await ghApi(`repos/${repo}/git/trees/main?recursive=1`, '[.tree[] | select(.type == "tree") | select(.path | test("^plugins/[^/]+$")) | .path] | map(split("/")[1])');
    const dirs = JSON.parse(raw);
    return dirs.map((pluginName) => ({
        name: pluginName,
        description: "",
        version: "",
        installed: installedNames.has(pluginName),
        marketplace,
    }));
}
function parseBrowse(out, marketplace, installedNames) {
    if (!out)
        return [];
    const plugins = [];
    for (const line of out.split("\n")) {
        const match = line.match(/•\s+(\S+)\s+-\s+(.*)/);
        if (match) {
            const [, pluginName, description] = match;
            plugins.push({
                name: pluginName,
                description: description.trim(),
                version: "",
                installed: installedNames.has(pluginName),
                marketplace,
            });
        }
    }
    return plugins;
}
export function installPlugin(name) {
    try {
        const out = run(`copilot plugin install ${name}`);
        return { success: true, message: out || `✓ Installed ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Install failed: ${e}` };
    }
}
export async function installPluginAsync(name) {
    try {
        const out = await runAsync(`copilot plugin install ${name}`);
        return { success: true, message: out || `✓ Installed ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Install failed: ${e}` };
    }
}
export function uninstallPlugin(name) {
    try {
        const out = run(`copilot plugin uninstall ${name}`);
        return { success: true, message: out || `✓ Uninstalled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Uninstall failed: ${e}` };
    }
}
export async function uninstallPluginAsync(name) {
    try {
        const out = await runAsync(`copilot plugin uninstall ${name}`);
        return { success: true, message: out || `✓ Uninstalled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Uninstall failed: ${e}` };
    }
}
export function enablePlugin(name) {
    try {
        const out = run(`copilot plugin enable ${name}`);
        return { success: true, message: out || `✓ Enabled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Enable failed: ${e}` };
    }
}
export async function enablePluginAsync(name) {
    try {
        const out = await runAsync(`copilot plugin enable ${name}`);
        return { success: true, message: out || `✓ Enabled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Enable failed: ${e}` };
    }
}
export function disablePlugin(name) {
    try {
        const out = run(`copilot plugin disable ${name}`);
        return { success: true, message: out || `✓ Disabled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Disable failed: ${e}` };
    }
}
export async function disablePluginAsync(name) {
    try {
        const out = await runAsync(`copilot plugin disable ${name}`);
        return { success: true, message: out || `✓ Disabled ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Disable failed: ${e}` };
    }
}
export function updatePlugin(name) {
    try {
        const out = run(`copilot plugin update ${name}`);
        return { success: true, message: out || `✓ Updated ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Update failed: ${e}` };
    }
}
export async function updatePluginAsync(name) {
    try {
        const out = await runAsync(`copilot plugin update ${name}`);
        return { success: true, message: out || `✓ Updated ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Update failed: ${e}` };
    }
}
export function addMarketplace(spec) {
    try {
        const out = run(`copilot plugin marketplace add ${spec}`);
        return { success: true, message: out || `✓ Added marketplace ${spec}` };
    }
    catch (e) {
        return { success: false, message: `✗ Add marketplace failed: ${e}` };
    }
}
export async function addMarketplaceAsync(spec) {
    try {
        const out = await runAsync(`copilot plugin marketplace add ${spec}`);
        return { success: true, message: out || `✓ Added marketplace ${spec}` };
    }
    catch (e) {
        return { success: false, message: `✗ Add marketplace failed: ${e}` };
    }
}
export function removeMarketplace(name) {
    try {
        const out = run(`copilot plugin marketplace remove ${name}`);
        return { success: true, message: out || `✓ Removed marketplace ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Remove marketplace failed: ${e}` };
    }
}
export async function removeMarketplaceAsync(name) {
    try {
        const out = await runAsync(`copilot plugin marketplace remove ${name}`);
        return { success: true, message: out || `✓ Removed marketplace ${name}` };
    }
    catch (e) {
        return { success: false, message: `✗ Remove marketplace failed: ${e}` };
    }
}
/** Fetch a plugin's README.md from its marketplace repo via gh API. */
export async function fetchPluginReadmeAsync(pluginName, marketplaceUrl) {
    const repo = repoFromUrl(marketplaceUrl);
    if (!repo)
        return "";
    const raw = await ghApi(`repos/${repo}/contents/plugins/${pluginName}/README.md`, ".content");
    return Buffer.from(raw.replace(/\n/g, ""), "base64").toString("utf-8");
}
