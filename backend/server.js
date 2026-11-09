import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import sequelize from "./config/database.js";
import "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import clearanceRoutes from "./routes/clearanceRoutes.js";
import officerRoutes from "./routes/officerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import { removeUploadedFiles } from "./middleware/upload.js";
import { startEventBus, stopEventBus, eventBusStatus } from "./services/eventBus.js";
import { closeAllStreams } from "./services/realtime.js";
import { shutdownPasswordPool } from "./services/passwordPool.js";
import { INSTANCE_ID, STARTED_AT } from "./utils/instance.js";

// Refuse to start without a JWT secret instead of issuing broken tokens
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to backend/.env (see .env.example).");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a load balancer / reverse proxy, the client's real IP arrives in
// X-Forwarded-For. TRUST_PROXY=1 means "trust one proxy in front of me"
// (needed for correct IPs in the audit log, sessions and rate limiting).
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === "true" ? true : trustProxy);
}
app.disable("x-powered-by");

// Every response says which server process answered it, and carries a
// request id (kept from the load balancer if it set one) for tracing a
// request through the logs.
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("X-Served-By", INSTANCE_ID);
  next();
});

app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((o) => o.trim()),
    exposedHeaders: ["X-Served-By", "X-Request-Id"],
  })
);
app.use(express.json({ limit: "100kb" }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Health check used by the load balancer to decide whether to send traffic
// here. Returns 503 while shutting down or if the database is unreachable.
let shuttingDown = false;
app.get("/api/health", async (req, res) => {
  let database = "ok";
  try {
    await sequelize.query("SELECT 1");
  } catch {
    database = "unreachable";
  }
  const healthy = !shuttingDown && database === "ok";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : shuttingDown ? "shutting_down" : "unhealthy",
    instance: INSTANCE_ID,
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: STARTED_AT,
    database,
    eventBus: eventBusStatus().connected ? "connected" : "disconnected",
  });
});

// General API rate limit, per server process (logins have their own
// stricter limit that is shared by all servers — see routes/authRoutes.js)
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: parseInt(process.env.API_RATE_LIMIT, 10) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please slow down." },
  })
);

// Authentication and sessions
app.use("/api/auth", authRoutes);

// Student clearance workflow
app.use("/api/clearance", clearanceRoutes);

// Officer work queue and decisions
app.use("/api/officer", officerRoutes);

// Administrator management, monitoring, reports, sessions and audit trail
app.use("/api/admin", adminRoutes);

// Offices, notifications, documents, live events (any logged-in user)
app.use("/api", commonRoutes);

app.get("/", (req, res) => {
  res.send(`MUST Clearance backend is running! (${INSTANCE_ID})`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error-handling middleware. Express 5 forwards errors thrown in async
// handlers here automatically.
app.use((err, req, res, next) => {
  // Files uploaded with a request that failed are not kept
  removeUploadedFiles(req.files);

  const status = err.status || 500;
  if (status >= 500) console.error(`[${req.id}]`, err.stack);

  res.status(status).json({
    // Don't leak internal error details to the client
    message: status >= 500 ? "Internal server error" : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
});

// Connect to PostgreSQL, then start the server
let server;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    await startEventBus();
    console.log(`[${INSTANCE_ID}] PostgreSQL connected, event bus listening`);

    server = app.listen(PORT, () => {
      console.log(`[${INSTANCE_ID}] Server running on port ${PORT}`);
    });
    // Keep idle keep-alive connections from the load balancer a little
    // longer than the load balancer does, so it never reuses a closed one
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
  } catch (error) {
    console.error("Unable to start:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown: report unhealthy so the load balancer stops sending
// new requests, let requests in progress finish, close live streams (the
// browsers reconnect to another server), then release the database.
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[${INSTANCE_ID}] ${signal} received — shutting down gracefully`);

  const forceExit = setTimeout(() => process.exit(1), 15_000);
  forceExit.unref();

  closeAllStreams();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await Promise.allSettled([stopEventBus(), shutdownPasswordPool()]);
  await sequelize.close();
  console.log(`[${INSTANCE_ID}] stopped`);
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
