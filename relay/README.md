# Badsoffware relay

A tiny WebSocket relay so friends on different networks (KL, Amsterdam, Bucharest) can play together. Everyone connects *out* to the relay, so there is no Wi-Fi sharing, port forwarding, NAT or TURN to fight. The relay does not understand the game: a guest's frames go to the host, the host's go to every guest.

It runs as a Cloudflare Worker with one Durable Object per room. The free plan is plenty for friends (a 10 minute 4 player round is a few thousand billed requests against 100,000 a day).

## Deploy (about 10 minutes, one time)
1. Make a free Cloudflare account at https://dash.cloudflare.com/sign-up (no card needed for the free plan).
2. On any computer with Node 18+:
   ```
   cd relay
   npm install
   npx wrangler login      # opens a browser, approve it
   npx wrangler deploy
   ```
3. It prints a URL like `https://badsoffware-relay.<your-name>.workers.dev`. Check it in a browser: it should say `badsoffware relay ok`.
4. Tell the game about it. Either put it in `CONFIG.RELAY_URL` in `index.html` as the `wss://` form (`wss://badsoffware-relay.<your-name>.workers.dev`), then `tools/deploy_pages.sh`, or test first without editing anything by opening the game with `?relay=wss://badsoffware-relay.<your-name>.workers.dev`.
5. If you ever serve the game from a different address than `https://soffianz.github.io`, add it to `ALLOWED_ORIGINS` in `wrangler.toml` and deploy again. The relay refuses any other website.

## Play
Host taps HOST GAME, then taps the room code to send the invite link (WhatsApp, etc). Opening the link joins the room straight away. The 4 letter code still works through JOIN GAME. Guests see their ping in the top right while playing (green under 120 ms, yellow under 250, red above).

## Running it yourself instead
`node dev-server.mjs [port]` is the same relay for any plain VPS (`LAG_MS=140 node dev-server.mjs` adds artificial lag per direction to feel an overseas link). Put it behind TLS (Caddy or nginx), because the game runs on https and browsers refuse plain `ws://` from it.

## Protocol
`wss://<relay>/room/<CODE>?role=host|guest&id=<clientId>`. Control frames from the server: `{"ctl":"hosted"}`, `{"ctl":"joined"}`, `{"ctl":"error","reason":"taken|noroom|full"}`, `{"ctl":"host_left"}`. Everything else passes through untouched, 8 KB max per frame.

## Tests
`node test/v2_relay.mjs` (needs `npm install` here and the static server on :8123) runs a real host and guests in separate browser contexts through `dev-server.mjs`, including drops, wrong codes, taken codes, invite links, the host leaving, an unreachable relay and a 280 ms link. `RELAY=ws://127.0.0.1:8787 node test/v2_relay.mjs` runs the same checks against `npx wrangler dev`, the actual Worker.
