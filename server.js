import express from "express";
import dns from "node:dns/promises";
import net from "node:net";

const app = express();
const PORT = Number(process.env.PORT || 10000);

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}

async function safeUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are allowed");
  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".localhost")) throw new Error("Local hosts are not allowed");

  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("Private or local addresses are not allowed");
  }
  return url;
}

function rewriteHtml(html, baseUrl) {
  html = html.replace(/<meta[^>]+http-equiv=["']content-security-policy["'][^>]*>/gi, "");
  html = html.replace(/\b(href|src|action)=["']([^"']+)["']/gi, (m, attr, value) => {
    if (/^(#|data:|mailto:|javascript:)/i.test(value)) return m;
    try {
      const absolute = new URL(value, baseUrl).href;
      return `${attr}="/proxy?url=${encodeURIComponent(absolute)}"`;
    } catch {
      return m;
    }
  });
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl.replace(/"/g, "&quot;")}">`);
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/proxy", async (req, res) => {
  try {
    const target = await safeUrl(String(req.query.url || ""));
    const upstream = await fetch(target, {
      redirect: "manual",
      headers: { "User-Agent": "RemoteBrowser/1.0" }
    });

    if ([301, 302, 303, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get("location");
      if (!location) return res.status(upstream.status).end();
      const next = await safeUrl(new URL(location, target).href);
      return res.redirect(upstream.status, `/proxy?url=${encodeURIComponent(next.href)}`);
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    res.status(upstream.status).set("Content-Type", contentType);

    if (contentType.includes("text/html")) {
      const html = await upstream.text();
      return res.send(rewriteHtml(html, target.href));
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    res.status(400).send(`<h1>Unable to load page</h1><p>${String(error.message).replace(/[&<>]/g, "")}</p>`);
  }
});

app.use(express.static("public"));
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Remote Browser listening on port ${PORT}`);
});
