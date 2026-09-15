# 🐟 Fish Arena

A browser-based fish survival arena inspired by the eat-to-grow genre, with original UI/game code, local progression, skins, and a WebRTC multiplayer foundation.

## Features

- Fast canvas-based fish arena gameplay
- Eat smaller fish to grow
- Five selectable fish skins
- Local progress using `localStorage`
- Guest mode
- Account UI ready for Firebase/Auth0/Supabase integration
- WebRTC peer-to-peer transport foundation
- Responsive mouse + touch controls

## Run locally

Because this is an ES-module browser app, serve the folder with any static server. For example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Multiplayer architecture

WebRTC can carry the actual gameplay connection peer-to-peer, but peers still need a **signaling channel** to exchange SDP offers/answers and ICE candidates. GitHub Pages is static hosting, so it cannot itself provide signaling.

The next production step is to add a tiny WebSocket signaling service (for example Cloudflare Workers, Fly.io, Render, or a small Node server). After signaling, the `PeerRoom` transport in `app.js` can be expanded into room creation, player state replication, collision authority, reconnects, and host migration.

## Accounts

The current sign-in screen deliberately stores a local identity only. Never store real passwords in `localStorage`. For production authentication, connect the UI to a hosted authentication provider and store only the provider session/token in a secure manner.

## Roadmap

- [ ] WebRTC signaling service
- [ ] Authoritative multiplayer state + interpolation
- [ ] Matchmaking / room browser
- [ ] Cloud account progression
- [ ] More maps, hazards, boosts, quests and skins
- [ ] Sound and music
- [ ] Mobile joystick
- [ ] Anti-cheat validation

## License

MIT
