import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = storedHash.split(":");
  const actualHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure PostgreSQL.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('student', 'officer', 'admin')),
      login TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (role, login)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
  `);

  const demoUsers = [
    ["student-1", "student", "2023/BSE/058/PS", "Kamukama Osbert", process.env.DEMO_STUDENT_PASSWORD || "student123"],
    ["officer-1", "officer", "finance.officer@must.ac.ug", "Finance Officer", process.env.DEMO_OFFICER_PASSWORD || "officer123"],
    ["admin-1", "admin", "admin@must.ac.ug", "System Administrator", process.env.DEMO_ADMIN_PASSWORD || "admin123"],
  ];

  for (const [id, role, login, name, password] of demoUsers) {
    await pool.query(
      `INSERT INTO users (id, role, login, name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role, login) DO NOTHING`,
      [id, role, login.toLowerCase(), name, hashPassword(password)],
    );
  }
}

export async function findUser(role, login) {
  const result = await pool.query(
    "SELECT id, role, login, name, password_hash AS \"passwordHash\" FROM users WHERE role = $1 AND login = $2",
    [role, login],
  );
  return result.rows[0] || null;
}

export async function createSession(userId, sessionId, expiresAt) {
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, userId, expiresAt],
  );
}

export async function findSessionUser(sessionId) {
  if (!sessionId) return null;
  const result = await pool.query(
    `SELECT u.id, u.role, u.login, u.name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId],
  );
  return result.rows[0] || null;
}

export async function deleteSession(sessionId) {
  if (sessionId) await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

export async function deleteExpiredSessions() {
  await pool.query("DELETE FROM sessions WHERE expires_at <= NOW()");
}

export async function closeDatabase() {
  await pool.end();
}

export { pool };
