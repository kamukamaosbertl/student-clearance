import dotenv from "dotenv";
dotenv.config();

import cluster from "cluster";
import os from "os";

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent server with pre-forked worker processes
// (course: fork.pdf, L4 "Server concurrency models")
//
//   npm run start:cluster
//
// Like the concurrent TCP server in the notes, the PRIMARY process does not
// handle requests itself: it fork()s one worker process per CPU core. All
// workers share the same listening port; the primary accepts connections
// and hands them to the workers in turn (round-robin), so the machine's
// cores all serve clients at the same time.
//
// If a worker crashes, the primary forks a replacement — the server keeps
// running. Ctrl+C / SIGTERM shuts every worker down gracefully.
//
// Set WEB_CONCURRENCY in .env to choose the number of workers.
// ─────────────────────────────────────────────────────────────────────────────

const WORKERS = Math.max(1, parseInt(process.env.WEB_CONCURRENCY, 10) || os.availableParallelism?.() || os.cpus().length);

if (cluster.isPrimary) {
  console.log(`[primary ${process.pid}] forking ${WORKERS} worker(s) on port ${process.env.PORT || 5000}`);

  let stopping = false;
  const recentCrashes = [];

  const forkWorker = () => cluster.fork();
  for (let i = 0; i < WORKERS; i++) forkWorker();

  cluster.on("exit", (worker, code, signal) => {
    if (stopping) return;
    console.log(`[primary] worker ${worker.process.pid} died (${signal || code}) — forking a replacement`);

    // Avoid a crash loop: if workers keep dying straight away, wait a bit
    const now = Date.now();
    recentCrashes.push(now);
    while (recentCrashes.length && now - recentCrashes[0] > 60_000) recentCrashes.shift();
    const delay = recentCrashes.length > 5 ? 5000 : 0;
    setTimeout(forkWorker, delay);
  });

  const shutdown = (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`[primary] ${signal} — stopping workers`);
    for (const worker of Object.values(cluster.workers)) worker.process.kill("SIGTERM");
    setTimeout(() => process.exit(0), 16_000).unref();
    cluster.on("exit", () => {
      if (Object.keys(cluster.workers).length === 0) process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} else {
  // Each worker is a full copy of the server, named after its port and pid
  process.env.INSTANCE_ID ||= `${os.hostname()}:${process.env.PORT || 5000}:worker-${cluster.worker.id}:${process.pid}`;
  await import("./server.js");
}
