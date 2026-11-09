import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { INSTANCE_ID } from "../utils/instance.js";

dotenv.config();

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

// Connection pool settings (course: "Why pooling? Reuses connections
// instead of creating new ones for each request").
//
// Each server process keeps between DB_POOL_MIN and DB_POOL_MAX open
// connections and lends them to requests. Keep
//   (number of processes) x DB_POOL_MAX
// below PostgreSQL's max_connections (100 by default). With 3 instances x
// 4 cluster workers x 10 = 120 you would need to lower DB_POOL_MAX.
export const poolConfig = {
  max: int(process.env.DB_POOL_MAX, 10),
  min: int(process.env.DB_POOL_MIN, 0),
  idle: int(process.env.DB_POOL_IDLE_MS, 10_000), // close a connection unused for this long
  acquire: int(process.env.DB_POOL_ACQUIRE_MS, 30_000), // give up waiting for a free connection
};

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: false,
  pool: poolConfig,
  dialectOptions: {
    // Shows up in pg_stat_activity, so you can see which server owns which connection
    application_name: `must-clearance:${INSTANCE_ID}`.slice(0, 63),
  },
});

// Plain connection settings for the event bus, which needs its own
// long-lived connection outside the pool to LISTEN for notifications
export const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Pool usage right now (for the admin "System status" page)
export function poolStats() {
  const pool = sequelize.connectionManager.pool;
  return {
    max: poolConfig.max,
    size: pool?.size ?? 0,
    available: pool?.available ?? 0,
    using: pool?.using ?? 0,
    waiting: pool?.waiting ?? 0,
  };
}

export default sequelize;
