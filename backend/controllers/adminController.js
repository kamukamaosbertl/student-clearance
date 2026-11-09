import { Op, fn, col } from "sequelize";
import {
  User,
  Office,
  ClearanceApplication,
  ClearanceStage,
  AuditLog,
  Session,
  Job,
} from "../models/index.js";
import { hashPassword, passwordPoolStats } from "../services/passwordPool.js";
import { revokeAllForUser, revokeSession, activeSessionWhere, serializeSession } from "../services/sessionService.js";
import { queueStats } from "../services/jobQueue.js";
import { realtimeStats } from "../services/realtime.js";
import { eventBusStatus } from "../services/eventBus.js";
import { invalidateCache } from "../utils/cache.js";
import { poolStats } from "../config/database.js";
import { INSTANCE_ID, STARTED_AT } from "../utils/instance.js";
import { STAGE_STATUS, APPLICATION_STATUS, ACTIONABLE_STATUSES } from "../utils/constants.js";
import { badRequest, conflict, notFound } from "../utils/httpError.js";
import { isEmail, isRegNo, clean, validateNewPassword, pagination } from "../utils/validators.js";
import { serializeUser, serializeOffice, serializeApplication } from "../utils/serializers.js";
import { logAudit } from "../services/auditService.js";
import { applicationInclude, applicationOrder } from "./clearanceController.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROLES = ["student", "officer", "admin"];

// ── Overview & reports (sections 6.7, 7.12) ──────────────────────────────────

// GET /api/admin/overview
export async function getOverview(req, res) {
  const [usersByRole, applicationsByStatus, offices, stages, recentActivity] = await Promise.all([
    User.findAll({ attributes: ["role", [fn("COUNT", col("id")), "count"]], group: ["role"], raw: true }),
    ClearanceApplication.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      raw: true,
    }),
    Office.findAll({ order: [["sequence", "ASC"]] }),
    ClearanceStage.findAll({
      attributes: ["officeId", "status", "queuedAt", "decidedAt"],
      include: [{ model: ClearanceApplication, as: "application", attributes: [], where: { status: { [Op.ne]: APPLICATION_STATUS.DRAFT } } }],
      raw: true,
    }),
    AuditLog.findAll({
      include: [{ model: User, as: "user", attributes: ["id", "fullName", "role"] }],
      order: [["createdAt", "DESC"]],
      limit: 8,
    }),
  ]);

  const toMap = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));
  const applications = toMap(applicationsByStatus, "status");

  // Per-office workload and average decision time (section 8.5 / reports)
  const officeStats = offices.map((office) => {
    const own = stages.filter((s) => s.officeId === office.id);
    const by = (statuses) => own.filter((s) => statuses.includes(s.status)).length;
    const decided = own.filter((s) => s.status === STAGE_STATUS.APPROVED && s.queuedAt && s.decidedAt);
    const avgDays = decided.length
      ? decided.reduce((sum, s) => sum + (new Date(s.decidedAt) - new Date(s.queuedAt)), 0) / decided.length / DAY_MS
      : null;
    const oldestWaiting = own
      .filter((s) => ACTIONABLE_STATUSES.includes(s.status) && s.queuedAt)
      .reduce((max, s) => Math.max(max, (Date.now() - new Date(s.queuedAt)) / DAY_MS), 0);

    return {
      office: serializeOffice(office),
      inQueue: by(ACTIONABLE_STATUSES),
      correctionRequired: by([STAGE_STATUS.CORRECTION_REQUIRED]),
      approved: by([STAGE_STATUS.APPROVED]),
      rejected: by([STAGE_STATUS.REJECTED]),
      notRequired: by([STAGE_STATUS.NOT_REQUIRED]),
      waiting: by([STAGE_STATUS.WAITING]),
      averageDecisionDays: avgDays === null ? null : Math.round(avgDays * 10) / 10,
      oldestWaitingDays: Math.floor(oldestWaiting),
    };
  });

  res.json({
    users: { student: 0, officer: 0, admin: 0, ...toMap(usersByRole, "role") },
    applications: {
      total: Object.values(applications).reduce((a, b) => a + b, 0),
      in_progress: applications.in_progress || 0,
      completed: applications.completed || 0,
      rejected: applications.rejected || 0,
    },
    offices: officeStats,
    recentActivity: recentActivity.map(serializeAudit),
  });
}

// GET /api/admin/reports/applications.csv — exportable clearance report
export async function exportApplicationsCsv(req, res) {
  const applications = await ClearanceApplication.findAll({
    where: { status: { [Op.ne]: APPLICATION_STATUS.DRAFT } },
    include: [
      { model: User, as: "user", attributes: ["studentId", "fullName", "programme", "department"] },
      { model: ClearanceStage, as: "stages", include: [{ model: Office, as: "office", attributes: ["name", "sequence"] }] },
    ],
    order: [["startedAt", "DESC"]],
  });

  const offices = await Office.findAll({ order: [["sequence", "ASC"]] });
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    // Quote every cell and neutralise spreadsheet formulas
    return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };

  const header = [
    "Registration number", "Student", "Programme", "Department", "Academic year",
    "Status", "Started", "Completed", ...offices.map((o) => o.name),
  ];
  const lines = [header.map(escape).join(",")];

  for (const app of applications) {
    const statusFor = (office) => app.stages.find((s) => s.officeId === office.id)?.status || "";
    lines.push(
      [
        app.user?.studentId, app.user?.fullName, app.user?.programme, app.user?.department,
        app.academicYear, app.status,
        app.startedAt?.toISOString().slice(0, 10), app.completedAt?.toISOString().slice(0, 10),
        ...offices.map(statusFor),
      ].map(escape).join(",")
    );
  }

  await logAudit({ req, action: "report.exported", details: { rows: applications.length } });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="clearance-report-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + lines.join("\r\n"));
}

// ── Clearance monitoring ─────────────────────────────────────────────────────

// GET /api/admin/applications?status=&q=
export async function listApplications(req, res) {
  const { limit, offset } = pagination(req.query, 50);
  const where = { status: { [Op.ne]: APPLICATION_STATUS.DRAFT } };
  if (req.query.status && Object.values(APPLICATION_STATUS).includes(req.query.status)) {
    where.status = req.query.status;
  }

  const q = clean(req.query.q, 100);
  const userWhere = q
    ? { [Op.or]: [{ fullName: { [Op.iLike]: `%${q}%` } }, { studentId: { [Op.iLike]: `%${q}%` } }] }
    : undefined;

  const { rows, count } = await ClearanceApplication.findAndCountAll({
    where,
    include: [
      { model: User, as: "user", attributes: ["id", "studentId", "fullName", "programme", "department"], where: userWhere },
      { model: ClearanceStage, as: "stages", include: [{ model: Office, as: "office" }] },
    ],
    order: [["startedAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  res.json({
    total: count,
    applications: rows.map((app) => {
      const data = serializeApplication(app);
      const current = data.stages.find((s) => !["approved", "not_required"].includes(s.status));
      return { ...data, currentOffice: current ? current.office.name : null, currentStatus: current?.status ?? null };
    }),
  });
}

// GET /api/admin/applications/:id
export async function getApplication(req, res) {
  const application = await ClearanceApplication.findByPk(req.params.id, {
    include: [
      { model: User, as: "user", attributes: { exclude: ["passwordHash"] } },
      ...applicationInclude,
    ],
    order: applicationOrder,
  });
  if (!application) throw notFound("Clearance request not found.");
  res.json({ application: serializeApplication(application) });
}

// ── User management ──────────────────────────────────────────────────────────

// GET /api/admin/users?role=&q=
export async function listUsers(req, res) {
  const { limit, offset } = pagination(req.query, 50);
  const where = {};
  if (ROLES.includes(req.query.role)) where.role = req.query.role;

  const q = clean(req.query.q, 100);
  if (q) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { studentId: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ["passwordHash"] },
    include: [{ model: Office, as: "office", attributes: ["id", "name", "slug", "code"] }],
    order: [["role", "ASC"], ["fullName", "ASC"]],
    limit,
    offset,
  });

  res.json({ total: count, users: rows.map(serializeUser) });
}

async function validateUserInput(body, { creating, existingUser } = {}) {
  const role = creating ? body.role : body.role ?? existingUser.role;
  if (!ROLES.includes(role)) throw badRequest("Role must be student, officer or admin.");

  const values = { role };
  if (body.fullName !== undefined || creating) {
    values.fullName = clean(body.fullName, 120);
    if (!values.fullName) throw badRequest("Full name is required.");
  }
  if (body.email !== undefined || creating) {
    values.email = clean(body.email).toLowerCase() || null;
    if (values.email && !isEmail(values.email)) throw badRequest("Enter a valid email address.");
  }
  if (body.studentId !== undefined || creating) {
    values.studentId = clean(body.studentId, 40).toUpperCase() || null;
    if (values.studentId && !isRegNo(values.studentId)) throw badRequest("Use the format 2023/BSE/058/PS for the registration number.");
  }
  for (const field of ["programme", "faculty", "department"]) {
    if (body[field] !== undefined) values[field] = clean(body[field], 120) || null;
  }
  if (body.isActive !== undefined) values.isActive = Boolean(body.isActive);

  if (body.officeId !== undefined) {
    values.officeId = body.officeId ? parseInt(body.officeId, 10) : null;
    if (values.officeId && !(await Office.findByPk(values.officeId))) throw badRequest("Office not found.");
  }

  const final = { ...(existingUser?.get() || {}), ...values };
  if (final.role === "student" && !final.studentId) throw badRequest("Students need a registration number.");
  if (final.role !== "student" && !final.email) throw badRequest("Officers and administrators need an email address.");
  if (final.role === "officer" && !final.officeId) throw badRequest("Assign the officer to an office.");
  if (final.role !== "officer") values.officeId = null;

  return values;
}

// POST /api/admin/users
export async function createUser(req, res) {
  const values = await validateUserInput(req.body, { creating: true });
  const passwordError = validateNewPassword(req.body.password);
  if (passwordError) throw badRequest(passwordError);

  try {
    const user = await User.create({
      ...values,
      passwordHash: await hashPassword(req.body.password),
      isActive: values.isActive ?? true,
    });
    await logAudit({ req, action: "user.created", entityType: "user", entityId: user.id, details: { role: user.role } });
    const created = await User.findByPk(user.id, { include: [{ model: Office, as: "office" }] });
    res.status(201).json({ user: serializeUser(created) });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") throw conflict("A user with that email or registration number already exists.");
    throw error;
  }
}

// PATCH /api/admin/users/:id
export async function updateUser(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw notFound("User not found.");

  const values = await validateUserInput(req.body, { existingUser: user });

  // An administrator can't lock themselves out
  if (user.id === req.user.id && (values.isActive === false || values.role !== "admin")) {
    throw badRequest("You cannot deactivate your own account or remove your own admin role.");
  }

  try {
    await user.update(values);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") throw conflict("A user with that email or registration number already exists.");
    throw error;
  }

  // A deactivated account loses access immediately on every server
  if (values.isActive === false) await revokeAllForUser(user.id, "account_disabled");

  await logAudit({ req, action: "user.updated", entityType: "user", entityId: user.id, details: { fields: Object.keys(values) } });
  const updated = await User.findByPk(user.id, { include: [{ model: Office, as: "office" }] });
  res.json({ user: serializeUser(updated) });
}

// POST /api/admin/users/:id/reset-password  { password }
export async function resetPassword(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw notFound("User not found.");

  const passwordError = validateNewPassword(req.body.password);
  if (passwordError) throw badRequest(passwordError);

  await user.update({ passwordHash: await hashPassword(req.body.password) });
  await revokeAllForUser(user.id, "password_changed");
  await logAudit({ req, action: "user.password_reset", entityType: "user", entityId: user.id });
  res.json({ message: "Password reset." });
}

// ── Offices (system configuration) ───────────────────────────────────────────

// GET /api/admin/offices
export async function listOfficesAdmin(req, res) {
  const offices = await Office.findAll({
    order: [["sequence", "ASC"]],
    include: [{ model: User, as: "officers", attributes: ["id"], where: { isActive: true }, required: false }],
  });
  res.json({
    offices: offices.map((o) => ({ ...serializeOffice(o), officerCount: o.officers.length })),
  });
}

// PATCH /api/admin/offices/:id  { isActive, isRequired, description }
// Changes apply to new clearance requests; requests already in progress
// keep the stages they were created with.
export async function updateOffice(req, res) {
  const office = await Office.findByPk(req.params.id);
  if (!office) throw notFound("Office not found.");

  const values = {};
  if (req.body.isActive !== undefined) values.isActive = Boolean(req.body.isActive);
  if (req.body.isRequired !== undefined) values.isRequired = Boolean(req.body.isRequired);
  if (req.body.description !== undefined) values.description = clean(req.body.description, 500);

  if (office.slug === "registrar" && values.isActive === false) {
    throw badRequest("The Academic Registrar finalizes every clearance and cannot be deactivated.");
  }

  await office.update(values);
  invalidateCache("offices"); // every server drops its cached office list
  await logAudit({ req, action: "office.updated", entityType: "office", entityId: office.id, details: values });
  res.json({ office: serializeOffice(office) });
}

// ── Audit logs (section 7.13) ────────────────────────────────────────────────

function serializeAudit(log) {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
    user: log.user ? { id: log.user.id, fullName: log.user.fullName, role: log.user.role } : null,
  };
}

// GET /api/admin/audit-logs?action=&limit=&offset=
export async function listAuditLogs(req, res) {
  const { limit, offset } = pagination(req.query, 50);
  const where = {};
  const action = clean(req.query.action, 60);
  if (action) where.action = { [Op.iLike]: `${action}%` };

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "role"] }],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  res.json({ total: count, logs: rows.map(serializeAudit) });
}

// ── Sessions ─────────────────────────────────────────────────────────────────

// GET /api/admin/sessions — every active session in the system
export async function listSessions(req, res) {
  const sessions = await Session.findAll({
    where: activeSessionWhere(),
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "role", "studentId", "email"] }],
    order: [["lastSeenAt", "DESC"]],
    limit: 500,
  });
  res.json({ sessions: sessions.map((s) => serializeSession(s, req.session.id)) });
}

// DELETE /api/admin/sessions/:id — end one session
export async function endSession(req, res) {
  const session = await Session.findByPk(req.params.id);
  if (!session) throw notFound("Session not found.");
  if (session.id === req.session.id) throw badRequest("Use Log out to end your own session.");

  await revokeSession(session.id, "admin");
  await logAudit({ req, action: "session.ended", entityType: "user", entityId: session.userId });
  res.json({ message: "Session ended." });
}

// POST /api/admin/users/:id/logout-all — end every session of a user
export async function logoutUserEverywhere(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw notFound("User not found.");
  if (user.id === req.user.id) throw badRequest("Use Log out to end your own sessions.");

  const count = await revokeAllForUser(user.id, "admin");
  await logAudit({ req, action: "session.ended", entityType: "user", entityId: user.id, details: { sessions: count } });
  res.json({ message: `Ended ${count} session(s).` });
}

// ── System status (load balancing, pools, queue, real-time) ─────────────────

// GET /api/admin/system — what THIS server process is doing right now.
// Behind the load balancer each call may be answered by a different server;
// the "instance" field shows which one.
export async function systemStatus(req, res) {
  const [queue, activeSessions, recentFailures] = await Promise.all([
    queueStats(),
    Session.count({ where: activeSessionWhere() }),
    Job.findAll({
      where: { status: "failed" },
      order: [["updatedAt", "DESC"]],
      limit: 5,
      attributes: ["id", "type", "attempts", "lastError", "updatedAt"],
    }),
  ]);

  const memory = process.memoryUsage();
  res.json({
    instance: INSTANCE_ID,
    pid: process.pid,
    startedAt: STARTED_AT,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(memory.rss / 1024 / 1024),
    node: process.version,
    databasePool: poolStats(),
    passwordThreads: passwordPoolStats(),
    realtime: realtimeStats(),
    eventBus: eventBusStatus(),
    sessions: { active: activeSessions },
    queue: { ...queue, recentFailures },
  });
}
