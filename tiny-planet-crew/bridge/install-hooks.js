#!/usr/bin/env node
// Adds the Tiny Planet Crew hooks to ~/.claude/settings.json (backs it up first, keeps existing hooks).
const fs = require('fs'), path = require('path'), os = require('os');
const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const hookCmd = `node ${JSON.stringify(path.join(__dirname, 'hook.js'))}`;
let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); fs.copyFileSync(settingsPath, settingsPath + '.bak-' + Date.now()); } catch (e) {}
settings.hooks = settings.hooks || {};
for (const ev of ['SessionStart', 'UserPromptSubmit', 'Notification', 'Stop', 'SessionEnd']) {
  const list = settings.hooks[ev] = settings.hooks[ev] || [];
  const already = list.some(g => (g.hooks || []).some(h => (h.command || '').includes('tiny-planet-crew') && (h.command || '').includes('hook.js')));
  if (!already) list.push({ hooks: [{ type: 'command', command: hookCmd }] });
}
fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('✓ hooks installed in', settingsPath);
console.log('  each Claude Code session will now appear as a robot on the tile named after its folder.');
