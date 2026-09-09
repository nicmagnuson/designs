#!/usr/bin/env node
// Serves the game over http://localhost:4747 so index.html can poll state.json.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const PORT = process.env.PORT || 4747;
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.png': 'image/png' };
http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split('?')[0]); if (f === '/') f = '/index.html';
  const file = path.join(ROOT, f); if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
}).listen(PORT, () => console.log(`🪐 Tiny Planet Crew → http://localhost:${PORT}`));
