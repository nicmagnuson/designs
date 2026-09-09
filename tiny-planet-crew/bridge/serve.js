#!/usr/bin/env node
// Tiny Planet Crew local server.
//   node bridge/serve.js            → http://localhost:4747
// Serves the game, state.json, and a few local-only endpoints:
//   POST /open?session=ID&cwd=/path   opens a terminal running `claude --resume ID` in that folder
//   POST /open?cwd=/path              opens a terminal with a fresh `claude` in that folder
//   GET  /routines                    returns routines.json (scheduled tasks)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execFile } = require('child_process');
const ROOT = path.join(__dirname, '..'); const PORT = process.env.PORT || 4747;
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.png': 'image/png', '.md': 'text/plain' };

function openTerminal(cmd, cwd) {
  const dir = cwd && fs.existsSync(cwd) ? cwd : process.env.HOME || ROOT;
  const full = `cd ${JSON.stringify(dir)} && ${cmd}`;
  if (process.platform === 'darwin') {
    const script = `tell application "Terminal"\n activate\n do script ${JSON.stringify(full)}\nend tell`;
    execFile('osascript', ['-e', script], () => {});
  } else if (process.platform === 'win32') {
    const c = spawn('cmd', ['/c', 'start', 'cmd', '/k', full], { detached: true, stdio: 'ignore' }); c.on('error', () => {}); c.unref();
  } else {
    const c = spawn('x-terminal-emulator', ['-e', `bash -lc ${JSON.stringify(full + '; exec bash')}`], { detached: true, stdio: 'ignore' }); c.on('error', () => {}); c.unref();
  }
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (url.pathname === '/open' && req.method === 'POST') {
    const sid = url.searchParams.get('session'), cwd = url.searchParams.get('cwd') || '';
    if (sid && !/^[a-zA-Z0-9_-]+$/.test(sid)) { res.writeHead(400); return res.end('bad session id'); }
    openTerminal(sid ? `claude --resume ${sid}` : 'claude', cwd);
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}');
  }
  if (url.pathname === '/routines') {
    fs.readFile(path.join(ROOT, 'routines.json'), (err, d) => { res.writeHead(err ? 404 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(err ? '{"routines":[]}' : d); }); return;
  }
  let f = decodeURIComponent(url.pathname); if (f === '/') f = '/index.html';
  const file = path.join(ROOT, f); if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
}).listen(PORT, '127.0.0.1', () => console.log(`🪐 Tiny Planet Crew → http://localhost:${PORT}`));
