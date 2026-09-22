# Remote Browser

A lightweight browser-style web workspace converted from the original Fish Arena project.

## Features

- Address bar for public HTTP/HTTPS pages
- Back, forward, reload, and home controls
- Server-side page fetching through an Express proxy
- Basic protection against local/private destinations
- Sandboxed remote-page iframe
- Render-ready Node web service

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:10000`.

## Deploy to Render

This repo includes `render.yaml`. Deploy it as a Node web service with:

- Build command: `npm install`
- Start command: `npm start`

The server listens on `0.0.0.0` and uses Render's `PORT` environment variable.

## Limitations

This is a lightweight web proxy, not a full Chrome/Firefox replacement. Some sites will not work because they depend on browser features, authentication, WebSockets, cross-origin behavior, or strict security policies. Only use it for websites you are allowed to access.

## License

MIT
