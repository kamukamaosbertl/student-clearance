import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Job } from "../models/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Message queue — Message-Oriented Middleware (course L9: "asynchronous —
// sends messages that are collected and stored until they are acted upon,
// while the client continues with other processing").
//
// Producers (the API servers) call enqueue() and carry on immediately.
// Consumers (worker.js processes) take jobs off the queue and process them.
// The queue is a PostgreSQL table, so messages survive restarts (reliable
// delivery) and failed jobs are retried with increasing delays.
// ─────────────────────────────────────────────────────────────────────────────

export const JOBS_CHANNEL = "jobs_ready";

export async function enqueue(type, payload = {}, { runAt = new Date(), maxAttempts = 5, transaction } = {}) {
  const job = await Job.create({ type, payload, runAt, maxAttempts }, { transaction });
  // Wake up an idle worker straight away instead of waiting for its next poll
  await sequelize.query("SELECT pg_notify(:channel, :type)", {
    replacements: { channel: JOBS_CHANNEL, type },
    transaction,
  });
  return job;
}

// Atomically takes the oldest due job. FOR UPDATE SKIP LOCKED lets many
// workers take jobs at the same time without ever getting the same one.
export async function claimNext(workerId) {
  const rows = await sequelize.query(
    `UPDATE jobs SET status = 'running', "lockedAt" = NOW(), "lockedBy" = :workerId,
            attempts = attempts + 1, "updatedAt" = NOW()
     WHERE id = (
       SELECT id FROM jobs
       WHERE status = 'queued' AND "runAt" <= NOW()
       ORDER BY "runAt", id
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING *`,
    { replacements: { workerId }, type: QueryTypes.SELECT }
  );
  return rows[0] || null;
}

export async function completeJob(job) {
  await Job.update({ status: "done", completedAt: new Date(), lastError: null }, { where: { id: job.id } });
}

// Failed jobs are retried after 10 s, 20 s, 40 s, ... until maxAttempts
export async function failJob(job, error) {
  const finalFailure = job.attempts >= job.maxAttempts;
  const delayMs = 10_000 * 2 ** (job.attempts - 1);
  await Job.update(
    {
      status: finalFailure ? "failed" : "queued",
      lastError: String(error?.message || error).slice(0, 2000),
      runAt: finalFailure ? job.runAt : new Date(Date.now() + delayMs),
      lockedAt: null,
      lockedBy: null,
    },
    { where: { id: job.id } }
  );
  return finalFailure;
}

// Jobs left "running" by a worker that crashed go back on the queue
export async function requeueStuckJobs(olderThanMinutes = 10) {
  const [, meta] = await sequelize.query(
    `UPDATE jobs SET status = 'queued', "lockedAt" = NULL, "lockedBy" = NULL
     WHERE status = 'running' AND "lockedAt" < NOW() - (:minutes || ' minutes')::interval`,
    { replacements: { minutes: String(olderThanMinutes) } }
  );
  return meta?.rowCount ?? 0;
}

export async function queueStats() {
  const rows = await sequelize.query(`SELECT status, COUNT(*)::int AS count FROM jobs GROUP BY status`, {
    type: QueryTypes.SELECT,
  });
  const stats = { queued: 0, running: 0, done: 0, failed: 0 };
  for (const row of rows) stats[row.status] = row.count;
  return stats;
}
