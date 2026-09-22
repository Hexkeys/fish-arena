import express from "express";
import dns from "node:dns/promises";
import net from "node:net";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const PUBLIC_HOSTS = new Set(["localhost", "127.0.0.1"]);

function blockedAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      a >= 224;
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return x === "::1" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80:");
  }
  return true;
}

async function safeUrl(raw) {
  const u = new URL(raw);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only HTTP(S) URLs are supported.");
  if (PUBLIC_HOSTS.has(u.hostname)) throw new Error("Local addresses are not allowed.");
  const records = await dns.lookup(u.hostname, { all: true });
  if (!records.length || records.some(r => blockedAddress(r.address))) throw new Error("Private or local destinations are blocked.");
  return u;
}

function proxied(value, base) {
  if (!value || value.startsWith("#") || value.startsWith("data:") || value.startsWith("javascript:") || value.startsWith("mailto:")) return value;
  try {
    const absolute = new URL(value, base).toString();
    return "/proxy?url=" + encodeURIComponent(absolute);
  } catch { return value; }
}

function rewriteHtml(html, baseUrl) {
  html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");
  html = html.replace(/<base[^>]*>/gi, "");
  html = html.replace(/<(a|area|link)\b([^>]*?)\s(href)=(["'])(.*?)\4/gi,
    (_, tag, attrs, name, q, value) => `<${tag}${attrs} ${name}=${q}${proxied(value, baseUrl)}${q}`);
  html = html.replace(/<(script|img|iframe|source|video|audio|input)\b([^>]*?)\s(src|action)=(["'])(.*?)\4/gi,
    (_, tag, attrs, name, q, value) => `<${tag}${attrs} ${name}=${q}${proxied(value, baseUrl)}${q}`);
  html = html.replace(/(<form\b[^>]*?\saction=)(["'])(.*?)\2/gi,
    (_, start, q, value) => start + q + proxied(value, baseUrl) + q);
  html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + baseUrl.replace(/"/g, "&quot;") + '">');
  return html;
}

app.use(express.static("public"));

app.get("/proxy", async (req, res) => {
  try {
    const target = await safeUrl(String(req.query.url || ""));
    const upstream = await fetch(target, {
      redirect: "manual",
      headers: { "user-agent": "RemoteBrowser/1.0" }
    });
    if ([301,302,303,307,308].includes(upstream.status)) {
      const location = upstream.headers.get("location");
      if (!location) return res.status(502).send("Upstream redirect had no location.");
      const next = new URL(location, target).toString();
      await safeUrl(next);
      return res.redirect("/proxy?url=" + encodeURIComponent(next));
    }
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    res.status(upstream.status).set("content-type", type);
    if (type.includes("text/html")) {
      const html = await upstream.text();
      return res.send(rewriteHtml(html, target.toString()));
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (err) {
    res.status(400).send(`<h1>Unable to open page</h1><p>${String(err.message).replace(/[<>&]/g, "")}</p>`);
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));
app.listen(PORT, "0.0.0.0", () => console.log(`Remote Browser listening on ${PORT}`));
