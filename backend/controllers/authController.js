import { User, Office, Session } from "../models/index.js";
import { logAudit } from "../services/auditService.js";
import { hashPassword, verifyPassword } from "../services/passwordPool.js";
import {
  createSession,
  revokeSession,
  revokeAllForUser,
  activeSessionWhere,
  serializeSession,
  SESSION_IDLE_MINUTES,
  SESSION_MAX_HOURS,
} from "../services/sessionService.js";
import { serializeUser } from "../utils/serializers.js";
import { validateNewPassword } from "../utils/validators.js";

// Checks the password and, if it matches, starts a server-side session.
// Shared by the student and the staff login.
async function attemptLogin(req, res, { user, identifier, invalidMessage, mustBeStaff }) {
  const { password } = req.body;

  // Use the same message whether the account or the password is wrong, so
  // the response doesn't reveal which accounts exist. Run a dummy
  // comparison too, so both cases take about the same time.
  if (!user) {
    const dummyHash = process.env.DUMMY_BCRYPT_HASH;
    if (dummyHash) await verifyPassword(password, dummyHash).catch(() => {});
    await logAudit({ req, action: "auth.login_failed", details: identifier });
    return res.status(401).json({ message: invalidMessage });
  }

  if (mustBeStaff && user.role === "student") {
    return res.status(403).json({ message: "Please use the student login page." });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
  }

  // bcrypt runs in the password thread pool, not on the main thread
  const passwordIsCorrect = await verifyPassword(password, user.passwordHash);
  if (!passwordIsCorrect) {
    await logAudit({ req, userId: user.id, action: "auth.login_failed" });
    return res.status(401).json({ message: invalidMessage });
  }

  const { session, token } = await createSession(user, req);
  await user.update({ lastLoginAt: new Date() });
  await logAudit({ req, userId: user.id, action: "auth.login", details: { session: session.id.slice(0, 8) } });

  const withOffice = await User.findByPk(user.id, {
    include: [{ model: Office, as: "office", attributes: ["id", "name", "slug", "code"] }],
  });

  // Never send the password hash to the client
  return res.status(200).json({
    message: "Login successful.",
    token,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      idleTimeoutMinutes: SESSION_IDLE_MINUTES,
      maxHours: SESSION_MAX_HOURS,
    },
    user: serializeUser(withOffice),
  });
}

// POST /api/auth/login  { studentId, password }
export const login = async (req, res) => {
  const { studentId, password } = req.body || {};
  if (!studentId || !password) {
    return res.status(400).json({ message: "Student ID and password are required." });
  }

  const normalizedStudentId = String(studentId).trim();
  const user = await User.findOne({ where: { studentId: normalizedStudentId } });

  return attemptLogin(req, res, {
    user,
    identifier: { studentId: normalizedStudentId },
    invalidMessage: "Invalid student ID or password.",
    mustBeStaff: false,
  });
};

// POST /api/auth/staff-login  { email, password }  (officers and administrators)
export const staffLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  return attemptLogin(req, res, {
    user,
    identifier: { email: normalizedEmail },
    invalidMessage: "Invalid email or password.",
    mustBeStaff: true,
  });
};

// GET /api/auth/me — the logged-in user's current details
export const me = async (req, res) => {
  res.json({
    user: serializeUser(req.user),
    session: { id: req.session.id, expiresAt: req.session.expiresAt, idleTimeoutMinutes: SESSION_IDLE_MINUTES },
  });
};

// POST /api/auth/logout — ends this session on the server
export const logout = async (req, res) => {
  await revokeSession(req.session.id, "logout");
  await logAudit({ req, action: "auth.logout" });
  res.json({ message: "Logged out." });
};

// POST /api/auth/logout-all — ends every session of this user (all devices)
export const logoutAll = async (req, res) => {
  const count = await revokeAllForUser(req.user.id, "logout_all");
  await logAudit({ req, action: "auth.logout_all", details: { sessions: count } });
  res.json({ message: `Logged out of ${count} session(s).` });
};

// GET /api/auth/sessions — this user's active sessions
export const mySessions = async (req, res) => {
  const sessions = await Session.findAll({
    where: { userId: req.user.id, ...activeSessionWhere() },
    order: [["lastSeenAt", "DESC"]],
  });
  res.json({ sessions: sessions.map((s) => serializeSession(s, req.session.id)) });
};

// POST /api/auth/change-password  { currentPassword, newPassword }
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required." });
  }

  const passwordError = validateNewPassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const user = await User.findByPk(req.user.id);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(400).json({ message: "Your current password is incorrect." });
  }

  await user.update({ passwordHash: await hashPassword(newPassword) });
  // Anyone else logged in with the old password is signed out
  const revoked = await revokeAllForUser(user.id, "password_changed", req.session.id);
  await logAudit({ req, action: "auth.password_changed", entityType: "user", entityId: user.id, details: { otherSessionsEnded: revoked } });

  res.json({ message: "Password changed. Your other sessions were signed out." });
};
