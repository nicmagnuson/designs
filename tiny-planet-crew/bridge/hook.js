#!/usr/bin/env node
// Tiny Planet Crew bridge: called by Claude Code hooks. Reads the hook JSON on stdin,
// updates state.json next to index.html so each Claude Code session shows up as a robot
// on the tile named after the project folder it is working in.
//
// Claude Code passes: { session_id, cwd, hook_event_name, message?, prompt?, ... }
const fs = require('fs'), path = require('path');
const STATE = process.env.TPC_STATE || path.join(__dirname, '..', 'state.json');

let raw = ''; process.stdin.setEncoding('utf8');
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => { try { update(JSON.parse(raw || '{}')); } catch (e) { /* never break Claude Code */ } });

function update(ev) {
  const sid = ev.session_id; if (!sid) return;
  const projectName = (ev.cwd && path.basename(ev.cwd)) || 'Unsorted';
  let state = { projects: [] };
  try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) {}
  let p = state.projects.find(x => x.name.toLowerCase() === projectName.toLowerCase());
  if (!p) { p = { name: projectName, agents: [] }; state.projects.push(p); }
  let a = p.agents.find(x => x.sessionId === sid);
  if (!a) { a = { sessionId: sid, name: 'Chat ' + sid.slice(0, 4), kind: 'chat', status: 'working', note: '', lastSeen: Date.now() }; p.agents.push(a); }
  const now = Date.now();
  switch (ev.hook_event_name) {
    case 'SessionStart':      a.status = 'working'; a.note = ''; a.lastSeen = now; break;
    case 'UserPromptSubmit':  a.status = 'working'; a.note = ''; a.lastSeen = now;
                              if (ev.prompt && !a.named) { a.name = String(ev.prompt).slice(0, 28).replace(/\s+/g, ' '); a.named = true; } break;
    case 'Notification':      // permission prompt or idle → it needs you
                              a.status = 'question'; a.note = ev.message || 'Waiting on you'; break;
    case 'Stop':              a.status = 'idle'; a.note = a.note || 'Finished its turn. Waiting on you.'; a.lastSeen = now; break;
    case 'SessionEnd':        a.status = 'done'; a.lastSeen = now; break;
    default:                  a.lastSeen = now;
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}
