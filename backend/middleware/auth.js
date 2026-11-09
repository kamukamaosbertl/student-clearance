import jwt from "jsonwebtoken";
import { User, Office } from "../models/index.js";

// Verifies the "Authorization: Bearer <token>" header, loads the user from
// the database and attaches it to req.user. The user is re-read on every
// request so that a deactivated account or a changed role takes effect
// immediately instead of when the token expires.
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }

  const user = await User.findByPk(payload.userId, {
    attributes: { exclude: ["passwordHash"] },
    include: [{ model: Office, as: "office", attributes: ["id", "name", "code", "slug"] }],
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Your account is not active. Please log in again." });
  }

  req.user = user;
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
