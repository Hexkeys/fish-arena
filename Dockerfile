FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive HOME=/root DISPLAY=:1

RUN apt-get update && apt-get install -y --no-install-recommends \
        nodejs npm \
        xvfb x11vnc fluxbox chromium \
        dbus-x11 xterm thunar websockify novnc \
        fonts-dejavu ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json /app/package.json
RUN npm install --omit=dev

COPY server.js /app/server.js
COPY public /app/public
COPY web/index.html /usr/share/novnc/index.html
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
