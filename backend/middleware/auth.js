import jwt from "jsonwebtoken";
import { User, Office } from "../models/index.js";
import { validateSession } from "../services/sessionService.js";

const SESSION_MESSAGES = {
  idle_timeout: "You were logged out after a period of inactivity. Please log in again.",
  expired: "Your session has expired. Please log in again.",
  logout: "You have been logged out. Please log in again.",
  logout_all: "You were logged out from all devices. Please log in again.",
  password_changed: "Your password was changed. Please log in again.",
  admin: "Your session was ended by an administrator. Please log in again.",
  account_disabled: "Your account has been deactivated.",
};

// Verifies the "Authorization: Bearer <token>" header, then checks the
// SERVER-SIDE session it points to and loads the user. Both are re-read on
// every request, so logout, an idle timeout, a deactivated account or a
// changed role take effect immediately on every server.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please log in to continue.", code: "NO_SESSION" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: SESSION_MESSAGES.expired, code: "SESSION_EXPIRED" });
  }

  // Tokens issued before sessions existed have no session id
  if (!payload.sid) {
    return res.status(401).json({ message: SESSION_MESSAGES.expired, code: "SESSION_EXPIRED" });
  }

  const { session, reason } = await validateSession(payload.sid, payload.userId);
  if (!session) {
    return res.status(401).json({
      message: SESSION_MESSAGES[reason] || SESSION_MESSAGES.expired,
      code: "SESSION_ENDED",
      reason,
    });
  }

  const user = await User.findByPk(payload.userId, {
    attributes: { exclude: ["passwordHash"] },
    include: [{ model: Office, as: "office", attributes: ["id", "name", "code", "slug"] }],
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: SESSION_MESSAGES.account_disabled, code: "SESSION_ENDED" });
  }

  req.user = user;
  req.session = session;
  next();
}

// Role-based access control: authorize("officer"), authorize("admin"), ...
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }
    next();
  };
}

// Officers must be linked to an office before they can use the work queue
export function requireOffice(req, res, next) {
  if (!req.user.officeId) {
    return res.status(403).json({
      message: "Your account is not assigned to an office yet. Please contact the administrator.",
    });
  }
  next();
}
