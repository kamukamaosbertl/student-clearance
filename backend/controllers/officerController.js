import { Op } from "sequelize";
import {
  Office,
  User,
  ClearanceApplication,
  ClearanceStage,
  ClearanceDocument,
  StageEvent,
} from "../models/index.js";
import { STAGE_STATUS, ACTIONABLE_STATUSES, OVERDUE_DAYS } from "../utils/constants.js";
import { badRequest } from "../utils/httpError.js";
import { pagination } from "../utils/validators.js";
import { serializeDocument, serializeEvent, serializeUser } from "../utils/serializers.js";
import {
  openStage,
  decideStage,
  getStageForOfficer,
  departmentScope,
  getDepartmentOfficeId,
} from "../services/workflowService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Status filters accepted by GET /api/officer/requests?status=...
const STATUS_FILTERS = {
  actionable: ACTIONABLE_STATUSES,
  pending: [STAGE_STATUS.PENDING],
  under_review: [STAGE_STATUS.UNDER_REVIEW],
  resubmitted: [STAGE_STATUS.RESUBMITTED],
  correction_required: [STAGE_STATUS.CORRECTION_REQUIRED],
  approved: [STAGE_STATUS.APPROVED],
  rejected: [STAGE_STATUS.REJECTED],
  all: [
    ...ACTIONABLE_STATUSES,
    STAGE_STATUS.CORRECTION_REQUIRED,
    STAGE_STATUS.APPROVED,
    STAGE_STATUS.REJECTED,
  ],
};

// Include for the student, restricted to the officer's department if needed
async function studentInclude(officer, extra = {}) {
  const department = departmentScope(officer, await getDepartmentOfficeId());
  return {
    model: User,
    as: "user",
    attributes: ["id", "studentId", "fullName", "programme", "faculty", "department"],
    // Case-insensitive exact match (escape LIKE wildcards in the name)
    ...(department ? { where: { department: { [Op.iLike]: department.replace(/[\\%_]/g, "\\$&") } } } : {}),
    ...extra,
  };
}

function daysWaiting(stage) {
  return stage.queuedAt ? Math.floor((Date.now() - new Date(stage.queuedAt).getTime()) / DAY_MS) : 0;
}

function serializeQueueItem(stage) {
  const student = stage.application.user;
  return {
    stageId: stage.id,
    status: stage.status,
    queuedAt: stage.queuedAt,
    decidedAt: stage.decidedAt,
    updatedAt: stage.updatedAt,
    daysWaiting: ACTIONABLE_STATUSES.includes(stage.status) ? daysWaiting(stage) : null,
    documentCount: stage.documents?.length ?? 0,
    application: {
      id: stage.application.id,
      status: stage.application.status,
      startedAt: stage.application.startedAt,
      academicYear: stage.application.academicYear,
    },
    student: {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      programme: student.programme,
      department: student.department,
    },
  };
}

async function queueQuery(officer, statuses) {
  return ClearanceStage.findAll({
    where: { officeId: officer.officeId, status: { [Op.in]: statuses } },
    include: [
      {
        model: ClearanceApplication,
        as: "application",
        required: true,
        include: [await studentInclude(officer, { required: true })],
      },
      { model: ClearanceDocument, as: "documents", attributes: ["id"] },
    ],
    order: [["queuedAt", "ASC"]],
  });
}

// GET /api/officer/dashboard
export async function getDashboard(req, res) {
  const officer = req.user;
  const stages = await queueQuery(officer, STATUS_FILTERS.all);

  const count = (statuses) => stages.filter((s) => statuses.includes(s.status)).length;
  const actionable = stages.filter((s) => ACTIONABLE_STATUSES.includes(s.status));

  const semesterStart = new Date();
  semesterStart.setMonth(semesterStart.getMonth() - 6);

  res.json({
    office: officer.office,
    stats: {
      pending: actionable.length,
      correctionRequested: count([STAGE_STATUS.CORRECTION_REQUIRED]),
      approvedThisSemester: stages.filter(
        (s) => s.status === STAGE_STATUS.APPROVED && s.decidedAt && new Date(s.decidedAt) >= semesterStart
      ).length,
      rejected: count([STAGE_STATUS.REJECTED]),
    },
    overdueDays: OVERDUE_DAYS,
    needsAttention: actionable
      .filter((s) => daysWaiting(s) >= OVERDUE_DAYS)
      .map(serializeQueueItem),
    nextUp: actionable.slice(0, 5).map(serializeQueueItem),
  });
}

// GET /api/officer/requests?status=actionable|all|approved|...
export async function listRequests(req, res) {
  const filter = req.query.status || "all";
  const statuses = STATUS_FILTERS[filter];
  if (!statuses) throw badRequest(`Unknown status filter "${filter}".`);

  const stages = await queueQuery(req.user, statuses);

  // Work that needs action first (oldest first), then everything else (newest first)
  const actionable = stages.filter((s) => ACTIONABLE_STATUSES.includes(s.status));
  const rest = stages
    .filter((s) => !ACTIONABLE_STATUSES.includes(s.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ office: req.user.office, requests: [...actionable, ...rest].map(serializeQueueItem) });
}

// GET /api/officer/requests/:stageId — opens the request (marks it under review)
export async function getRequest(req, res) {
  const stageId = parseInt(req.params.stageId, 10);
  if (!stageId) throw badRequest("Invalid request id.");

  await openStage({ officer: req.user, stageId });
  const stage = await getStageForOfficer(req.user, stageId);

  const [documents, events, allStages] = await Promise.all([
    ClearanceDocument.findAll({ where: { stageId }, order: [["uploadedAt", "ASC"]] }),
    StageEvent.findAll({
      where: { stageId },
      include: [{ model: User, as: "actor", attributes: ["id", "fullName", "role"] }],
      order: [["createdAt", "ASC"]],
    }),
    ClearanceStage.findAll({
      where: { applicationId: stage.applicationId },
      include: [{ model: Office, as: "office", attributes: ["id", "name", "slug"] }],
      order: [["sequence", "ASC"]],
    }),
  ]);

  const application = stage.application;

  res.json({
    request: {
      stageId: stage.id,
      status: stage.status,
      comment: stage.comment,
      queuedAt: stage.queuedAt,
      decidedAt: stage.decidedAt,
      canDecide: ACTIONABLE_STATUSES.includes(stage.status),
      office: { id: stage.office.id, name: stage.office.name, slug: stage.office.slug },
      student: serializeUser(application.user),
      application: {
        id: application.id,
        status: application.status,
        academicYear: application.academicYear,
        contactEmail: application.contactEmail,
        phone: application.phone,
        yearOfStudy: application.yearOfStudy,
        graduationYear: application.graduationYear,
        reason: application.reason,
        notes: application.notes,
        startedAt: application.startedAt,
      },
      documents: documents.map(serializeDocument),
      events: events.map(serializeEvent),
      workflow: allStages.map((s) => ({ office: s.office.name, slug: s.office.slug, status: s.status })),
    },
  });
}

// POST /api/officer/requests/:stageId/decision  { action, comment }
export async function decide(req, res) {
  const stageId = parseInt(req.params.stageId, 10);
  if (!stageId) throw badRequest("Invalid request id.");

  await decideStage({
    req,
    officer: req.user,
    stageId,
    action: req.body?.action,
    comment: req.body?.comment,
  });

  const stage = await ClearanceStage.findByPk(stageId);
  res.json({ message: "Decision recorded.", status: stage.status });
}

// GET /api/officer/history — decisions made by this officer, newest first
export async function getHistory(req, res) {
  const { limit, offset } = pagination(req.query, 100);

  const { rows, count } = await StageEvent.findAndCountAll({
    where: {
      actorId: req.user.id,
      action: { [Op.in]: ["approved", "rejected", "correction_requested"] },
    },
    include: [
      {
        model: ClearanceStage,
        as: "stage",
        attributes: ["id", "status"],
        include: [
          {
            model: ClearanceApplication,
            as: "application",
            attributes: ["id"],
            include: [{ model: User, as: "user", attributes: ["id", "studentId", "fullName"] }],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  res.json({
    total: count,
    history: rows.map((e) => ({
      id: e.id,
      stageId: e.stageId,
      decision: e.action,
      comment: e.comment,
      date: e.createdAt,
      currentStatus: e.stage?.status,
      student: e.stage?.application?.user
        ? { fullName: e.stage.application.user.fullName, studentId: e.stage.application.user.studentId }
        : null,
    })),
  });
}
