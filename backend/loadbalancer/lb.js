import dotenv from "dotenv";
dotenv.config();

import http from "http";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Load balancer / reverse proxy (course L1: "scales horizontally where
// multiple servers are there"; "disadvantages: dependability on server —
// if one or two servers fail ... services stop").
//
//   npm run lb            (or `npm run stack` to start everything at once)
//
// Clients connect to ONE address (port 5000). The balancer forwards each
// request to one of several identical API servers, so:
//   - load is spread across servers   (scalability)
//   - a server that fails is skipped  (availability / fault tolerance)
//   - servers can be added or restarted without users noticing
//
// Strategies:  LB_STRATEGY=round-robin (default) — each server in turn
//              LB_STRATEGY=least-connections   — the least busy server
// Health checks: every LB_HEALTH_INTERVAL_MS it calls GET /api/health on
// each server; a server that fails is taken out until it passes again.
//
// The servers keep no per-user state in memory (sessions, rate limits and
// events live in PostgreSQL), so ANY server can answer ANY request — no
// "sticky sessions" needed.
// ─────────────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.LB_PORT, 10) || 5000;
const STRATEGY = process.env.LB_STRATEGY === "least-connections" ? "least-connections" : "round-robin";
const HEALTH_INTERVAL_MS = parseInt(process.env.LB_HEALTH_INTERVAL_MS, 10) || 5000;
const BACKENDS = (process.env.LB_BACKENDS || "http://localhost:5001,http://localhost:5002,http://localhost:5003")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const STATIC_DIR = process.env.LB_STATIC_DIR ? path.resolve(process.env.LB_STATIC_DIR) : null;
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((o) => o.trim());
const LOG_REQUESTS = process.env.LB_LOG === "1";

// Keep-alive connections to the servers are reused instead of opening a new
// TCP connection for every request (connection pooling)
const agent = new http.Agent({ keepAlive: true, maxSockets: 256 });

const servers = BACKENDS.map((url) => {
  const { hostname, port } = new URL(url);
  return { url, hostname, port: Number(port) || 80, healthy: true, active: 0, requests: 0, failures: 0, lastCheck: null, lastError: null };
});

let rrIndex = 0;
const startedAt = new Date();

function log(...args) {
  console.log(new Date().toISOString(), "[lb]", ...args);
}

function markDown(server, reason) {
  if (server.healthy) log(`✗ ${server.url} is DOWN (${reason}) — taking it out of rotation`);
  server.healthy = false;
  server.lastError = reason;
  // Drop idle kept-alive connections to it so they aren't reused
  for (const [name, sockets] of Object.entries(agent.freeSockets)) {
    if (name.startsWith(`${server.hostname}:${server.port}:`)) sockets.forEach((socket) => socket.destroy());
  }
}

// Requests that can be sent again without side effects (no body, no change)
const IDEMPOTENT = new Set(["GET", "HEAD", "OPTIONS"]);

function markUp(server) {
  if (!server.healthy) log(`✓ ${server.url} is back UP — adding it to rotation`);
  server.healthy = true;
  server.lastError = null;
}

// Chooses the next healthy server, skipping any already tried for this request
function pickServer(exclude) {
  const candidates = servers.filter((s) => s.healthy && !exclude.has(s));
  if (candidates.length === 0) return null;

  if (STRATEGY === "least-connections") {
    return candidates.reduce((best, s) => (s.active < best.active ? s : best));
  }

  // Round-robin over the full list keeps the rotation fair when servers come and go
  for (let i = 0; i < servers.length; i++) {
    const server = servers[rrIndex++ % servers.length];
    if (candidates.includes(server)) return server;
  }
  return candidates[0];
}

// ── Active health checks ─────────────────────────────────────────────────────

function checkHealth(server) {
  const req = http.get(
    { hostname: server.hostname, port: server.port, path: "/api/health", timeout: 2000, agent: false },
    (res) => {
      res.resume();
      server.lastCheck = new Date();
      if (res.statusCode === 200) markUp(server);
      else markDown(server, `health check returned ${res.statusCode}`);
    }
  );
  req.on("timeout", () => req.destroy(new Error("health check timed out")));
  req.on("error", (error) => {
    server.lastCheck = new Date();
    markDown(server, error.code || error.message);
  });
}

setInterval(() => servers.forEach(checkHealth), HEALTH_INTERVAL_MS);
servers.forEach(checkHealth);

// ── Proxying ─────────────────────────────────────────────────────────────────

function sendJson(res, status, body, req) {
  const origin = req?.headers.origin;
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...(origin && ALLOWED_ORIGINS.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  });
  res.end(JSON.stringify(body));
}

function forward(req, res, tried = new Set()) {
  const server = pickServer(tried);
  if (!server) {
    return sendJson(res, 503, { message: "All servers are busy or unavailable. Please try again shortly." }, req);
  }
  tried.add(server);

  const headers = { ...req.headers };
  const clientIp = req.socket.remoteAddress;
  headers["x-forwarded-for"] = headers["x-forwarded-for"] ? `${headers["x-forwarded-for"]}, ${clientIp}` : clientIp;
  headers["x-forwarded-proto"] = headers["x-forwarded-proto"] || "http";
  headers["x-forwarded-host"] = headers["x-forwarded-host"] || headers.host;
  headers["x-request-id"] = headers["x-request-id"] || crypto.randomUUID();

  server.active++;
  server.requests++;
  let finished = false;
  const done = () => {
    if (!finished) {
      finished = true;
      server.active--;
    }
  };

  const proxyReq = http.request({
    hostname: server.hostname,
    port: server.port,
    method: req.method,
    path: req.url,
    headers,
    agent,
  });

  // The request body is only streamed once the TCP connection to the server
  // is established. If the server refuses the connection, the body hasn't
  // been touched yet — so even a POST (like a file upload) can safely be
  // retried on the next server.
  let bodyStarted = false;
  const startBody = () => {
    bodyStarted = true;
    req.pipe(proxyReq);
  };
  proxyReq.on("socket", (socket) => {
    if (socket.connecting) socket.once("connect", startBody);
    else startBody();
  });

  proxyReq.on("response", (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers, "x-load-balancer": "must-clearance-lb" };
    res.writeHead(proxyRes.statusCode, responseHeaders);
    // Live event streams must reach the browser immediately, not when a buffer fills
    if (String(proxyRes.headers["content-type"] || "").startsWith("text/event-stream")) {
      res.flushHeaders();
      proxyReq.setTimeout(0);
    }
    proxyRes.pipe(res);
    proxyRes.on("end", done);
    proxyRes.on("close", done);
    if (LOG_REQUESTS) log(`${req.method} ${req.url} → ${server.url} ${proxyRes.statusCode}`);
  });

  proxyReq.on("error", (error) => {
    done();
    markDown(server, error.code || error.message);
    // Safe to retry: the body never left, or the request has no side effects
    if ((!bodyStarted || IDEMPOTENT.has(req.method)) && !res.headersSent) {
      log(`${req.method} ${req.url}: ${server.url} failed (${error.code}) — retrying on another server`);
      return forward(req, res, tried);
    }
    if (!res.headersSent) sendJson(res, 502, { message: "The server stopped responding. Please try again." }, req);
    else res.destroy();
  });

  // If the browser goes away (e.g. closes the tab), stop the upstream request
  res.on("close", () => {
    if (!finished) proxyReq.destroy();
    done();
  });
}

// ── Optional: serve the built React app from the same address ────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(STATIC_DIR, urlPath);
  if (!file.startsWith(STATIC_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(STATIC_DIR, "index.html"); // single-page app: let React Router handle the path
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

// ── Server ───────────────────────────────────────────────────────────────────

const lb = http.createServer((req, res) => {
  if (req.url === "/lb/status") {
    return sendJson(
      res,
      200,
      {
        strategy: STRATEGY,
        startedAt,
        healthCheckIntervalMs: HEALTH_INTERVAL_MS,
        servers: servers.map(({ url, healthy, active, requests, lastCheck, lastError }) => ({
          url,
          healthy,
          activeRequests: active,
          totalRequests: requests,
          lastCheck,
          lastError,
        })),
      },
      req
    );
  }

  if (STATIC_DIR && !req.url.startsWith("/api")) return serveStatic(req, res);
  forward(req, res);
});

// Live event streams stay open for a long time
lb.requestTimeout = 0;
lb.keepAliveTimeout = 60_000;

lb.listen(PORT, () => {
  log(`listening on http://localhost:${PORT} — ${STRATEGY} across ${servers.length} server(s):`);
  servers.forEach((s) => log(`   • ${s.url}`));
  if (STATIC_DIR) log(`serving the frontend from ${STATIC_DIR}`);
});

const stop = () => {
  log("stopping");
  lb.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
