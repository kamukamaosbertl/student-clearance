import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Session } from "../models/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Server-side sessions
//
// Login creates a Session row; the token the browser keeps is a signed JWT
// that only says "session <id> of user <id>". On every request the server
// looks the session up, so:
//   - Logout really ends the session (a stolen token stops working).
//   - Sessions expire after SESSION_IDLE_MINUTES without activity and after
//     SESSION_MAX_HOURS in total.
//   - Every server behind the load balancer sees the same sessions because
//     they are in the shared database — no "sticky sessions" needed.
// ─────────────────────────────────────────────────────────────────────────────

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const SESSION_IDLE_MINUTES = int(process.env.SESSION_IDLE_MINUTES, 30);
export const SESSION_MAX_HOURS = int(process.env.SESSION_MAX_HOURS, 12);

// lastSeenAt is written at most once per minute per session, so an active
// user doesn't cause a database write on every single request
const TOUCH_EVERY_MS = 60 * 1000;

export async function createSession(user, req) {
  const now = new Date();
  const session = await Session.create({
    userId: user.id,
    ipAddress: req.ip || null,
    userAgent: (req.headers["user-agent"] || "").slice(0, 300) || null,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MAX_HOURS * 60 * 60 * 1000),
  });

  const token = jwt.sign({ sid: session.id, userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: `${SESSION_MAX_HOURS}h`,
  });

  return { session, token };
}

// Returns { session } when the session is usable, otherwise { reason }
export async function validateSession(sessionId, userId) {
  const session = await Session.findByPk(sessionId);
  if (!session || session.userId !== userId) return { reason: "not_found" };
  if (session.revokedAt) return { reason: session.revokedReason || "revoked" };

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) return { reason: "expired" };

  if (now - session.lastSeenAt.getTime() > SESSION_IDLE_MINUTES * 60 * 1000) {
    await session.update({ revokedAt: new Date(), revokedReason: "idle_timeout" });
    return { reason: "idle_timeout" };
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    // Fire-and-forget: the request doesn't need to wait for this write
    Session.update({ lastSeenAt: new Date() }, { where: { id: session.id } }).catch(() => {});
  }

  return { session };
}

export async function revokeSession(sessionId, reason = "logout") {
  const [count] = await Session.update(
    { revokedAt: new Date(), revokedReason: reason },
    { where: { id: sessionId, revokedAt: null } }
  );
  return count;
}

// Ends every session of a user, optionally keeping the current one
export async function revokeAllForUser(userId, reason, exceptSessionId = null) {
  const where = { userId, revokedAt: null };
  if (exceptSessionId) where.id = { [Op.ne]: exceptSessionId };
  const [count] = await Session.update({ revokedAt: new Date(), revokedReason: reason }, { where });
  return count;
}

// Sessions that are still usable right now
export function activeSessionWhere() {
  return {
    revokedAt: null,
    expiresAt: { [Op.gt]: new Date() },
    lastSeenAt: { [Op.gt]: new Date(Date.now() - SESSION_IDLE_MINUTES * 60 * 1000) },
  };
}

export function serializeSession(session, currentSessionId) {
  return {
    id: session.id,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    current: session.id === currentSessionId,
    user: session.user
      ? { id: session.user.id, fullName: session.user.fullName, role: session.user.role, studentId: session.user.studentId, email: session.user.email }
      : undefined,
  };
}
