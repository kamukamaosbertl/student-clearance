import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";

// express-rate-limit store that keeps the counters in PostgreSQL, so every
// server process behind the load balancer shares one count per client.
// One atomic INSERT ... ON CONFLICT statement increments the counter and
// starts a new window when the old one has ended — no race between servers.
export default class PgRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false; // counts are shared, not per process
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const [row] = await sequelize.query(
      `INSERT INTO rate_limits ("key", hits, "resetAt")
       VALUES (:key, 1, NOW() + (:ms || ' milliseconds')::interval)
       ON CONFLICT ("key") DO UPDATE SET
         hits      = CASE WHEN rate_limits."resetAt" <= NOW() THEN 1 ELSE rate_limits.hits + 1 END,
         "resetAt" = CASE WHEN rate_limits."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE rate_limits."resetAt" END
       RETURNING hits, "resetAt"`,
      { replacements: { key: this.prefix + key, ms: String(this.windowMs) }, type: QueryTypes.SELECT }
    );
    return { totalHits: row.hits, resetTime: new Date(row.resetAt) };
  }

  async decrement(key) {
    await sequelize.query(`UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE "key" = :key`, {
      replacements: { key: this.prefix + key },
    });
  }

  async resetKey(key) {
    await sequelize.query(`DELETE FROM rate_limits WHERE "key" = :key`, {
      replacements: { key: this.prefix + key },
    });
  }
}
