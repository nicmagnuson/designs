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

// Pull the last assistant message out of the session transcript (JSONL), best effort.
function lastAssistantText(file) {
  try {
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').slice(-60).reverse();
    for (const ln of lines) {
      let o; try { o = JSON.parse(ln); } catch (e) { continue; }
      const m = o.message || o; if ((o.type || m.role) !== 'assistant' && m.role !== 'assistant') continue;
      const c = m.content; if (typeof c === 'string' && c.trim()) return c.trim();
      if (Array.isArray(c)) { const t = c.filter(x => x.type === 'text').map(x => x.text).join('\n').trim(); if (t) return t; }
    }
  } catch (e) {}
  return '';
}
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
  a.log = a.log || [];
  const say = (who, text) => { if (!text) return; a.log.push({ who, text: String(text).slice(0, 600), ts: now }); if (a.log.length > 40) a.log = a.log.slice(-40); };
  switch (ev.hook_event_name) {
    case 'SessionStart':      a.status = 'working'; a.note = ''; a.lastSeen = now; break;
    case 'UserPromptSubmit':  a.status = 'working'; a.note = ''; a.lastSeen = now;
                              say('you', ev.prompt); if (ev.prompt && !a.named) { a.name = String(ev.prompt).slice(0, 28).replace(/\s+/g, ' '); a.named = true; } break;
    case 'Notification':      // permission prompt or idle → it needs you
                              a.status = 'question'; a.note = ev.message || 'Waiting on you'; say('bot', a.note); break;
    case 'Stop': {           const last = lastAssistantText(ev.transcript_path); a.status = 'idle'; a.note = last ? last.slice(0, 200) : 'Finished its turn. Waiting on you.'; say('bot', last); a.lastSeen = now; break; }
    case 'SessionEnd':        a.status = 'done'; a.lastSeen = now; break;
    default:                  a.lastSeen = now;
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}
