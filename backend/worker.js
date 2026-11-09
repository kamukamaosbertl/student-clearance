import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import sequelize, { connectionConfig } from "./config/database.js";
import "./models/index.js";
import { Job } from "./models/index.js";
import { claimNext, completeJob, failJob, requeueStuckJobs, enqueue, JOBS_CHANNEL } from "./services/jobQueue.js";
import { handlers, recurringJobs } from "./services/jobHandlers.js";
import { mailTransport } from "./services/mailer.js";
import { INSTANCE_ID } from "./utils/instance.js";

// ─────────────────────────────────────────────────────────────────────────────
// Background worker — the consumer side of the message queue.
//
//   npm run worker
//
// Runs separately from the API servers, so slow work (sending email,
// scanning for overdue requests) never delays a user's request. Start as
// many workers as you like: they share the queue safely.
//
// It waits for work in two ways: a LISTEN connection that the API servers
// NOTIFY when they add a job (instant), and a poll every few seconds as a
// safety net (e.g. for retries whose time has come).
// ─────────────────────────────────────────────────────────────────────────────

const WORKER_ID = `worker:${INSTANCE_ID}`;
const CONCURRENCY = Math.max(1, parseInt(process.env.WORKER_CONCURRENCY, 10) || 2);
const POLL_MS = 5000;

let stopping = false;

// Consumers sleeping because the queue is empty
const sleepers = new Set();
const wake = () => {
  for (const resolve of sleepers) resolve();
  sleepers.clear();
};

function log(...args) {
  console.log(new Date().toISOString(), `[${WORKER_ID}]`, ...args);
}

async function processJob(job) {
  const handler = handlers[job.type];
  if (!handler) {
    await failJob({ ...job, attempts: job.maxAttempts }, new Error(`No handler for job type "${job.type}"`));
    log(`job ${job.id} ${job.type}: no handler`);
    return;
  }

  try {
    const result = await handler(job.payload || {});
    await completeJob(job);
    log(`job ${job.id} ${job.type}: done${result ? ` (${result})` : ""}`);
  } catch (error) {
    const final = await failJob(job, error);
    log(`job ${job.id} ${job.type}: attempt ${job.attempts} failed${final ? " permanently" : ", will retry"} — ${error.message}`);
  }
}

// One consumer loop; CONCURRENCY of these run side by side
async function consumerLoop(n) {
  while (!stopping) {
    let job = null;
    try {
      job = await claimNext(`${WORKER_ID}#${n}`);
    } catch (error) {
      log("queue error:", error.message);
    }

    if (job) {
      await processJob(job);
      continue;
    }

    // Queue empty: sleep until NOTIFY wakes us or the poll interval passes
    await new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        sleepers.delete(done);
        resolve();
      };
      const timer = setTimeout(done, POLL_MS);
      sleepers.add(done);
    });
  }
}

// Makes sure each recurring job has exactly one copy waiting in the queue.
// The advisory lock stops two workers from scheduling the same job twice.
async function scheduleRecurring() {
  for (const { type, everyMs } of recurringJobs) {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:type))", { replacements: { type }, transaction });
      const waiting = await Job.count({ where: { type, status: ["queued", "running"] }, transaction });
      if (waiting > 0) return;

      const last = await Job.findOne({ where: { type, status: "done" }, order: [["completedAt", "DESC"]], transaction });
      const runAt = last?.completedAt ? new Date(last.completedAt.getTime() + everyMs) : new Date();
      await enqueue(type, {}, { runAt, maxAttempts: 3, transaction });
    });
  }
}

async function listenForJobs() {
  const client = new pg.Client({ ...connectionConfig, application_name: WORKER_ID.slice(0, 63) });
  client.on("notification", () => wake());
  client.on("error", (error) => log("listen connection error:", error.message));
  await client.connect();
  await client.query(`LISTEN ${JOBS_CHANNEL}`);
  return client;
}

async function main() {
  await sequelize.authenticate();
  log(`started — ${CONCURRENCY} consumer(s), email transport: ${mailTransport()}`);

  const requeued = await requeueStuckJobs();
  if (requeued) log(`requeued ${requeued} job(s) left running by a stopped worker`);

  const listener = await listenForJobs();
  await scheduleRecurring();
  const scheduler = setInterval(() => scheduleRecurring().catch((e) => log("scheduler error:", e.message)), 60_000);

  const loops = Array.from({ length: CONCURRENCY }, (_, i) => consumerLoop(i + 1));

  // Graceful shutdown: finish the current jobs, then exit
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    log(`${signal} received, finishing current jobs…`);
    clearInterval(scheduler);
    wake();
    await Promise.all(loops);
    await listener.end().catch(() => {});
    await sequelize.close();
    log("stopped");
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
