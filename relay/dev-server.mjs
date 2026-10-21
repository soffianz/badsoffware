// Local relay with the same protocol as worker.js, for the tests and for running on any plain VPS
// instead of Cloudflare:  cd relay && npm install && node dev-server.mjs [port]
import { createRequire } from 'module';
import { createServer } from 'http';
const require = createRequire(import.meta.url);
const { WebSocketServer } = require('ws');

const MAX_FRAME = 8192, MAX_GUESTS = 6;
const LAG_MS = +process.env.LAG_MS || 0;       // test aid: delay every relayed frame, to feel what an overseas link does
const later = f => LAG_MS ? setTimeout(f, LAG_MS) : f();
const port = +process.argv[2] || +process.env.PORT || 8788;
const rooms = new Map();   // CODE -> { host: ws|null, guests: Set<ws> }

const http = createServer((q, r) => { r.end('badsoffware relay ok'); });
const wss = new WebSocketServer({ server: http, maxPayload: MAX_FRAME });
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4})$/);
  const refuse = reason => { ws.send(JSON.stringify({ ctl: 'error', reason })); ws.close(1000, reason); };
  if (!m) return ws.close(1008, 'bad path');
  const code = m[1].toUpperCase(), role = url.searchParams.get('role') === 'host' ? 'host' : 'guest';
  let room = rooms.get(code);
  if (role === 'host') {
    if (room && room.host) return refuse('taken');
    room = room || { host: null, guests: new Set() }; rooms.set(code, room); room.host = ws;
  } else {
    if (!room || !room.host) return refuse('noroom');
    if (room.guests.size >= MAX_GUESTS) return refuse('full');
    room.guests.add(ws);
  }
  ws.send(JSON.stringify({ ctl: role === 'host' ? 'hosted' : 'joined' }));
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    const s = data.toString();
    later(() => {
      if (role === 'host') { for (const g of room.guests) if (g.readyState === 1) g.send(s); }
      else if (room.host && room.host.readyState === 1) room.host.send(s);
    });
  });
  ws.on('close', () => {
    if (role === 'guest') { room.guests.delete(ws); return; }
    if (room.host === ws) {
      room.host = null;
      for (const g of room.guests) { try { g.send('{"ctl":"host_left"}'); g.close(1000, 'host_left'); } catch (e) { } }
      rooms.delete(code);
    }
  });
});
http.listen(port, () => console.log('badsoffware relay listening on :' + port));
