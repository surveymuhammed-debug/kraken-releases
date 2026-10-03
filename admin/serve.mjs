#!/usr/bin/env node
/*
 * Serve the Kraken Access panel on your local network. Zero dependencies.
 *
 *   node serve.mjs [port]      (default port 8080)
 *
 * Then open the printed http://<your-LAN-IP>:<port>/ on this machine or any
 * device on the same network. Signing works on all of them: when the browser
 * blocks WebCrypto on a plain-http LAN address, the panel falls back to its
 * own built-in ECDSA P-256 signer, so you do NOT need HTTPS or a certificate.
 */
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.argv[2] || process.env.PORT || "8080", 10);
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon",
  ".txt":"text/plain; charset=utf-8", ".md":"text/markdown; charset=utf-8" };

const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/" || p === "") p = "/kraken-admin.html";
    const fp = path.join(dir, path.normalize(p).replace(/^(\.\.[/\\])+/, ""));
    if (!fp.startsWith(dir)) { res.writeHead(403); return res.end("forbidden"); }
    fs.readFile(fp, (e, data) => {
      if (e) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "content-type": TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    });
  } catch (e) { res.writeHead(500); res.end("error"); }
});

server.listen(port, "0.0.0.0", () => {
  const ifaces = os.networkInterfaces(); const ips = [];
  for (const k in ifaces) for (const a of ifaces[k]) if (a.family === "IPv4" && !a.internal) ips.push(a.address);
  console.log("Kraken Access panel is serving on:");
  console.log("  http://localhost:" + port + "/");
  for (const ip of ips) console.log("  http://" + ip + ":" + port + "/   <- open this on other devices on your network");
  console.log("\nSigning works on every address above (built-in signer covers plain-http LAN pages).");
  console.log("Run this only on a network you trust. Press Ctrl+C to stop.");
});
