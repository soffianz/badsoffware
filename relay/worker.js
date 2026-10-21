// Badsoffware relay: a dumb WebSocket fan-in/fan-out per room, so players on different networks never
// need a direct peer-to-peer link (no NAT or TURN trouble). Deploy with `npx wrangler deploy` (relay/README.md).
//
// Protocol (same as relay/dev-server.mjs, which the tests use):
//   wss://<relay>/room/<CODE>?role=host|guest&id=<clientId>
//   server -> client control frames: {"ctl":"hosted"} {"ctl":"joined"} {"ctl":"error","reason":"taken|noroom|full"} {"ctl":"host_left"}
//   everything else is passed through untouched: a guest's frames go to the host only, the host's go to every guest.
const MAX_FRAME = 8192;       // a shared snapshot is ~3 KB; anything bigger is not ours
const MAX_GUESTS = 6;         // the game seats 3 guests; a little slack for reconnects racing their old socket

export class Room {
  constructor(state) { this.state = state; }

  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected a websocket', { status: 426 });
    const role = new URL(req.url).searchParams.get('role') === 'host' ? 'host' : 'guest';
    const { 0: client, 1: server } = new WebSocketPair();
    const hosts = this.state.getWebSockets('host');
    // refused sockets go through the same hibernation API (tagged 'refused', never relayed): mixing in a plain
    // server.accept() made the room throw "Network connection lost" when the refused browser hung up, which reset the room
    const refuse = reason => { this.state.acceptWebSocket(server, ['refused']); server.send(JSON.stringify({ ctl: 'error', reason })); server.close(1000, reason); };
    if (role === 'host' && hosts.length) refuse('taken');
    else if (role === 'guest' && !hosts.length) refuse('noroom');
    else if (role === 'guest' && this.state.getWebSockets('guest').length >= MAX_GUESTS) refuse('full');
    else {
      this.state.acceptWebSocket(server, [role]);
      server.send(JSON.stringify({ ctl: role === 'host' ? 'hosted' : 'joined' }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MAX_FRAME) return;
    const tags = this.state.getTags(ws);
    if (tags.includes('refused')) return;
    const fromHost = tags.includes('host');
    for (const peer of this.state.getWebSockets(fromHost ? 'guest' : 'host')) { try { peer.send(msg); } catch (e) { } }
  }

  // finish the closing handshake ourselves: without this a browser's ws.close() sat in CLOSING forever
  // (its onclose never fired), so a guest that dropped its link never noticed and never reconnected
  webSocketClose(ws, code) { this.left(ws); try { ws.close(code === 1005 || code === 1006 || !code ? 1000 : code, 'bye'); } catch (e) { } }
  webSocketError(ws) { this.left(ws); }
  left(ws) {
    if (!this.state.getTags(ws).includes('host')) return;
    for (const g of this.state.getWebSockets('guest')) { try { g.send('{"ctl":"host_left"}'); g.close(1000, 'host_left'); } catch (e) { } }
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4})$/);
    if (!m) return new Response('badsoffware relay ok');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(req.headers.get('Origin'))) return new Response('origin not allowed', { status: 403 });
    return env.ROOM.get(env.ROOM.idFromName(m[1].toUpperCase())).fetch(req);
  },
};
