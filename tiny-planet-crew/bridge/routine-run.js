#!/usr/bin/env node
// Runs one scheduled task from routines.json headlessly with `claude -p` and records the result
// on that routine's ⏰ robot in state.json.  Usage:  node bridge/routine-run.js <routine id>
// Schedule it with cron / launchd, e.g.  0 2 * * *  node /path/tiny-planet-crew/bridge/routine-run.js nightly-uploader
const fs = require('fs'), path = require('path'), { execFile } = require('child_process');
const ROOT = path.join(__dirname, '..');
const STATE = process.env.TPC_STATE || path.join(ROOT, 'state.json');
const id = process.argv[2]; if (!id) { console.error('usage: routine-run.js <routine id>'); process.exit(1); }
const routines = JSON.parse(fs.readFileSync(path.join(ROOT, 'routines.json'), 'utf8')).routines || [];
const r = routines.find(x => x.id === id); if (!r) { console.error('no routine ' + id); process.exit(1); }

function load() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return { projects: [] }; } }
function upsert(fn) {
  const state = load();
  let p = state.projects.find(x => x.name.toLowerCase() === r.project.toLowerCase()); if (!p) { p = { name: r.project, agents: [] }; state.projects.push(p); }
  let a = p.agents.find(x => x.sessionId === 'routine:' + r.id); if (!a) { a = { sessionId: 'routine:' + r.id, name: r.name, kind: r.kind || 'scheduled', status: 'working', note: '', log: [], lastSeen: Date.now() }; p.agents.push(a); }
  fn(a); a.log = (a.log || []).slice(-40); fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}
const now = Date.now();
upsert(a => { a.status = 'working'; a.note = 'Running now…'; a.lastSeen = now; a.log.push({ who: 'you', text: r.prompt, ts: now }); });
const cwd = r.cwd && fs.existsSync(r.cwd) ? r.cwd : process.env.HOME;
execFile('claude', ['-p', r.prompt, '--output-format', 'text'], { cwd, maxBuffer: 10 * 1024 * 1024, timeout: (r.timeoutMin || 20) * 60 * 1000 }, (err, stdout, stderr) => {
  const out = (stdout || '').trim(); const t = Date.now();
  upsert(a => {
    a.lastSeen = t;
    if (err && !out) { a.status = 'question'; a.note = 'Run failed: ' + String(stderr || err.message).slice(0, 200); a.log.push({ who: 'bot', text: a.note, ts: t }); return; }
    const finding = /FINDING:/i.test(out) || /\bIDEA:/i.test(out);
    a.status = finding ? 'finding' : 'done'; a.note = out.slice(0, 240); a.log.push({ who: 'bot', text: out.slice(0, 600), ts: t });
  });
  console.log(out || stderr);
});
