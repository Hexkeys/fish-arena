# 🐟 Fish Arena — Remote Device

Fish Arena now runs as an interactive remote Linux device instead of a browser proxy.

A Debian Linux desktop runs in Docker with Xvfb, Fluxbox, Chromium, xterm, Thunar, x11vnc, and noVNC. When you connect, you control the whole remote desktop with your mouse and keyboard, and Fish Arena opens inside the remote desktop.

## What you get

- Full remote Linux desktop
- Fish Arena running inside the remote desktop
- Mouse and keyboard control
- Terminal through xterm
- File manager through Thunar
- noVNC browser-based remote display
- Docker deployment for Render or another Docker host

## Run locally

```bash
docker compose up --build
```

Then open:

```
http://localhost:8080
```

Set a real `VNC_PASSWORD` before exposing the device publicly.

## Architecture

- Linux display: Xvfb
- Window manager: Fluxbox
- Main app: Chromium loading the Fish Arena app
- Terminal: xterm
- File manager: Thunar
- VNC server: x11vnc
- Remote web client: noVNC + websockify
- App server: Node.js + Express

## Render

The included `render.yaml` deploys the Docker image as a web service.

Set `VNC_PASSWORD` to a strong password in Render.

The service name remains `remote-browser`; the service itself now provides the remote Linux device described above.

## Security

The VNC session provides interactive access to the remote desktop. Use a strong password and HTTPS. Do not expose an unauthenticated remote desktop to the public internet.

## Fish Arena

The original Fish Arena gameplay, skins, local progression, guest mode, and WebRTC foundation remain in the project. The difference is that the game is now launched inside the remote Linux desktop instead of being exposed as a browser-proxy service.
