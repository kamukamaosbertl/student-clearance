import { Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  User,
  Office,
  ClearanceApplication,
  ClearanceStage,
  ClearanceDocument,
  StageEvent,
} from "../models/index.js";
import {
  STAGE_STATUS,
  ACTIONABLE_STATUSES,
  COMPLETED_STATUSES,
  STUDENT_ACTION_STATUSES,
  APPLICATION_STATUS,
  DECISIONS,
} from "../utils/constants.js";
import { academicYearFor } from "../utils/validators.js";
import HttpError, { badRequest, conflict, forbidden, notFound } from "../utils/httpError.js";
import { notifyUser, notifyOffice } from "./notificationService.js";
import { logAudit } from "./auditService.js";
import { publish } from "./eventBus.js";

// Tells every open screen that shows this request to refresh: the
// student's own pages, the queues of the offices involved, and the admin
// monitoring pages. Published inside the transaction, so it only goes out
// if the change is committed.
async function publishChange(application, officeIds, department, transaction) {
  const departmentScope = { officeId: await getDepartmentOfficeId(), department };
  await publish(
    "clearance.changed",
    {
      audience: { userIds: [application.userId], officeIds: [...new Set(officeIds)], roles: ["admin"], departmentScope },
      applicationId: application.id,
    },
    transaction
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow engine for the long-duration clearance transaction (sections 9, 10
// and 15 of the project plan).
//
//   Student submits ─► Finance ─► Library ─► Department ─► Student Affairs ─► Registrar ─► COMPLETED
//
// Only one office holds the request at a time (the first stage that is not
// approved / not required). A correction or rejection pauses the transaction
// at that office; already-approved stages are never repeated.
// Every change runs inside a database transaction and locks the application
// row, so two officers (or an officer and the student) can't change the same
// request at the same moment.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  [STAGE_STATUS.APPROVED]: "approved",
  [STAGE_STATUS.REJECTED]: "rejected",
  [STAGE_STATUS.CORRECTION_REQUIRED]: "requested a correction on",
};

// Records a stage state change in its history
async function recordEvent(stage, { actorId = null, action, fromStatus, toStatus, comment = null }, transaction) {
  return StageEvent.create(
    { stageId: stage.id, actorId, action, fromStatus, toStatus, comment },
    { transaction }
  );
}

// Department officers only see students from their own academic department.
// Officers of other offices, or Department officers without a department
// set, see every student.
export function departmentScope(officer, departmentOfficeId) {
  if (officer.role !== "officer") return null;
  if (officer.officeId !== departmentOfficeId) return null;
  if (!officer.department) return null;
  return officer.department;
}

let cachedDepartmentOfficeId;
export async function getDepartmentOfficeId() {
  if (cachedDepartmentOfficeId === undefined) {
    const office = await Office.findOne({ where: { slug: "department" }, attributes: ["id"] });
    cachedDepartmentOfficeId = office?.id ?? null;
  }
  return cachedDepartmentOfficeId;
}

// Moves the transaction forward: the first stage that is not completed
// becomes the active one. When every stage is completed the application
// is marked as completed.
async function advanceWorkflow(application, student, transaction) {
  const stages = await ClearanceStage.findAll({
    where: { applicationId: application.id },
    include: [{ model: Office, as: "office" }],
    order: [["sequence", "ASC"]],
    transaction,
  });

  const next = stages.find((s) => !COMPLETED_STATUSES.includes(s.status));

  if (!next) {
    await application.update(
      { status: APPLICATION_STATUS.COMPLETED, completedAt: new Date() },
      { transaction }
    );
    await notifyUser(
      student.id,
      {
        type: "clearance_completed",
        title: "Clearance completed",
        message: "All offices have cleared you. Your graduation clearance is complete.",
        link: "/clearance/progress",
      },
      transaction
    );
    return null;
  }

  if (next.status === STAGE_STATUS.WAITING) {
    await next.update({ status: STAGE_STATUS.PENDING, queuedAt: new Date() }, { transaction });
    await recordEvent(next, { action: "queued", fromStatus: STAGE_STATUS.WAITING, toStatus: STAGE_STATUS.PENDING }, transaction);
    await notifyOffice(
      next.officeId,
      {
        type: "new_request",
        title: "New clearance request",
        message: `${student.fullName} (${student.studentId}) is waiting for ${next.office.name} clearance.`,
        link: `/officer/request/${next.id}`,
        department: next.office.slug === "department" ? student.department : null,
      },
      transaction
    );
  }

  return next;
}

// ── Student actions ──────────────────────────────────────────────────────────

// Creates a clearance request with its stages and documents.
// `filesBySlug` maps an office slug (finance, library, ...) to uploaded files.
export async function submitApplication({ req, student, info, filesBySlug }) {
  const offices = await Office.findAll({ where: { isActive: true }, order: [["sequence", "ASC"]] });
  if (offices.length === 0) throw new HttpError(500, "No clearance offices are configured.");

  // Required offices that collect documents must get at least one file
  const missing = offices.filter(
    (o) => o.requiresDocuments && o.isRequired && !(filesBySlug[o.slug]?.length > 0)
  );
  if (missing.length > 0) {
    throw badRequest(`Attach at least one document for ${missing.map((o) => o.name).join(", ")}.`, {
      missingOffices: missing.map((o) => o.slug),
    });
  }

  const unknownSlugs = Object.keys(filesBySlug).filter(
    (slug) => !offices.some((o) => o.slug === slug && o.requiresDocuments)
  );
  if (unknownSlugs.length > 0) {
    throw badRequest(`Unknown document field(s): ${unknownSlugs.join(", ")}.`);
  }

  return sequelize.transaction(async (transaction) => {
    // Lock the student's row so two submissions at once can't both pass the check below
    await User.findByPk(student.id, { lock: transaction.LOCK.UPDATE, transaction });

    const existing = await ClearanceApplication.findOne({
      where: { userId: student.id, status: { [Op.ne]: APPLICATION_STATUS.DRAFT } },
      order: [["createdAt", "DESC"]],
      transaction,
    });
    if (existing?.status === APPLICATION_STATUS.COMPLETED) {
      throw conflict("Your clearance is already complete.");
    }
    if (existing) {
      throw conflict("You already have a clearance request in progress.");
    }

    const now = new Date();
    const application = await ClearanceApplication.create(
      {
        userId: student.id,
        academicYear: academicYearFor(now),
        status: APPLICATION_STATUS.IN_PROGRESS,
        startedAt: now,
        ...info,
      },
      { transaction }
    );

    for (const office of offices) {
      const files = filesBySlug[office.slug] || [];
      const skip = office.requiresDocuments && !office.isRequired && files.length === 0;

      const stage = await ClearanceStage.create(
        {
          applicationId: application.id,
          officeId: office.id,
          sequence: office.sequence,
          status: skip ? STAGE_STATUS.NOT_REQUIRED : STAGE_STATUS.WAITING,
        },
        { transaction }
      );

      await recordEvent(
        stage,
        {
          actorId: student.id,
          action: skip ? "skipped" : "submitted",
          fromStatus: null,
          toStatus: stage.status,
          comment: skip ? "No documents submitted — office marked as not applicable." : null,
        },
        transaction
      );

      if (files.length > 0) {
        await saveDocuments({ application, stage, files, documentType: "initial" }, transaction);
      }
    }

    await advanceWorkflow(application, student, transaction);

    await publishChange(application, offices.map((o) => o.id), student.department, transaction);

    await logAudit(
      {
        req,
        action: "clearance.submitted",
        entityType: "clearance_application",
        entityId: application.id,
        details: { files: Object.values(filesBySlug).flat().length },
      },
      transaction
    );

    return application.id;
  });
}

// Student responds to a correction request or a rejection
export async function resubmitStage({ req, student, stageId, files, message }) {
  if (files.length === 0 && !message) {
    throw badRequest("Attach a corrected document or write a message to the office.");
  }

  return sequelize.transaction(async (transaction) => {
    const stage = await ClearanceStage.findByPk(stageId, {
      include: [
        { model: ClearanceApplication, as: "application" },
        { model: Office, as: "office" },
      ],
      transaction,
    });

    if (!stage || stage.application.userId !== student.id) throw notFound("Clearance stage not found.");

    // Lock the application, then re-read the stage inside the lock
    await ClearanceApplication.findByPk(stage.applicationId, { lock: transaction.LOCK.UPDATE, transaction });
    await stage.reload({ transaction });

    if (!STUDENT_ACTION_STATUSES.includes(stage.status)) {
      throw conflict(`${stage.office.name} is not waiting for a response from you.`);
    }
    if (stage.office.requiresDocuments && files.length === 0 && stage.status === STAGE_STATUS.REJECTED) {
      throw badRequest("Attach at least one document to resubmit a rejected stage.");
    }

    const fromStatus = stage.status;
    if (files.length > 0) {
      await saveDocuments({ application: stage.application, stage, files, documentType: "correction" }, transaction);
    }

    await stage.update({ status: STAGE_STATUS.RESUBMITTED, queuedAt: new Date() }, { transaction });
    await recordEvent(
      stage,
      { actorId: student.id, action: "resubmitted", fromStatus, toStatus: STAGE_STATUS.RESUBMITTED, comment: message || null },
      transaction
    );

    // A rejected transaction becomes active again once the student responds
    if (stage.application.status === APPLICATION_STATUS.REJECTED) {
      await stage.application.update({ status: APPLICATION_STATUS.IN_PROGRESS }, { transaction });
    }

    await notifyOffice(
      stage.officeId,
      {
        type: "resubmitted",
        title: "Correction resubmitted",
        message: `${student.fullName} (${student.studentId}) responded to your ${fromStatus === STAGE_STATUS.REJECTED ? "rejection" : "correction request"}.`,
        link: `/officer/request/${stage.id}`,
        department: stage.office.slug === "department" ? student.department : null,
      },
      transaction
    );

    await publishChange(stage.application, [stage.officeId], student.department, transaction);

    await logAudit(
      {
        req,
        action: "clearance.resubmitted",
        entityType: "clearance_stage",
        entityId: stage.id,
        details: { office: stage.office.code, files: files.length },
      },
      transaction
    );

    return stage.id;
  });
}

async function saveDocuments({ application, stage, files, documentType }, transaction) {
  return ClearanceDocument.bulkCreate(
    files.map((file) => ({
      applicationId: application.id,
      stageId: stage.id,
      documentType,
      fileName: file.originalname.slice(0, 255),
      storageKey: file.filename,
      mimeType: file.mimetype,
      fileSize: file.size,
    })),
    { transaction }
  );
}

// ── Officer actions ──────────────────────────────────────────────────────────

// Loads a stage and checks the officer is allowed to work on it
export async function getStageForOfficer(officer, stageId, transaction) {
  const stage = await ClearanceStage.findByPk(stageId, {
    include: [
      { model: Office, as: "office" },
      {
        model: ClearanceApplication,
        as: "application",
        include: [{ model: User, as: "user", attributes: { exclude: ["passwordHash"] } }],
      },
    ],
    transaction,
  });

  if (!stage || stage.officeId !== officer.officeId || stage.status === STAGE_STATUS.WAITING) {
    throw notFound("Clearance request not found in your queue.");
  }

  const department = departmentScope(officer, await getDepartmentOfficeId());
  const studentDepartment = stage.application.user.department || "";
  if (department && studentDepartment.toLowerCase() !== department.toLowerCase()) {
    throw forbidden("This student belongs to a different department.");
  }

  return stage;
}

// Opening a request in the queue marks it "under review"
export async function openStage({ officer, stageId }) {
  return sequelize.transaction(async (transaction) => {
    const stage = await getStageForOfficer(officer, stageId, transaction);
    if ([STAGE_STATUS.PENDING, STAGE_STATUS.RESUBMITTED].includes(stage.status)) {
      await ClearanceApplication.findByPk(stage.applicationId, { lock: transaction.LOCK.UPDATE, transaction });
      await stage.reload({ transaction });
      if ([STAGE_STATUS.PENDING, STAGE_STATUS.RESUBMITTED].includes(stage.status)) {
        const fromStatus = stage.status;
        await stage.update({ status: STAGE_STATUS.UNDER_REVIEW }, { transaction });
        await recordEvent(
          stage,
          { actorId: officer.id, action: "opened", fromStatus, toStatus: STAGE_STATUS.UNDER_REVIEW },
          transaction
        );
        await publishChange(stage.application, [stage.officeId], stage.application.user.department, transaction);
      }
    }
    return stage.id;
  });
}

// Approve, reject or request a correction (sections 7.6–7.8)
export async function decideStage({ req, officer, stageId, action, comment }) {
  const text = typeof comment === "string" ? comment.trim().slice(0, 2000) : "";

  if (!Object.values(DECISIONS).includes(action)) {
    throw badRequest("Decision must be approve, reject or correction.");
  }
  if (action !== DECISIONS.APPROVE && !text) {
    throw badRequest("Add a comment so the student knows what to fix.");
  }

  return sequelize.transaction(async (transaction) => {
    const stage = await getStageForOfficer(officer, stageId, transaction);
    const application = await ClearanceApplication.findByPk(stage.applicationId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    await stage.reload({ transaction });
    const student = stage.application.user;

    if (!ACTIONABLE_STATUSES.includes(stage.status)) {
      throw conflict("A decision has already been recorded for this request.");
    }

    const now = new Date();
    const fromStatus = stage.status;
    const toStatus = {
      [DECISIONS.APPROVE]: STAGE_STATUS.APPROVED,
      [DECISIONS.REJECT]: STAGE_STATUS.REJECTED,
      [DECISIONS.CORRECTION]: STAGE_STATUS.CORRECTION_REQUIRED,
    }[action];

    await stage.update(
      {
        status: toStatus,
        comment: text || null,
        decidedBy: officer.id,
        decidedAt: now,
        clearedAt: toStatus === STAGE_STATUS.APPROVED ? now : null,
      },
      { transaction }
    );

    await recordEvent(
      stage,
      {
        actorId: officer.id,
        action: action === DECISIONS.CORRECTION ? "correction_requested" : toStatus,
        fromStatus,
        toStatus,
        comment: text || null,
      },
      transaction
    );

    // Documents of this stage take the outcome of the decision
    if (toStatus !== STAGE_STATUS.CORRECTION_REQUIRED) {
      await ClearanceDocument.update(
        { status: toStatus === STAGE_STATUS.APPROVED ? "approved" : "rejected" },
        { where: { stageId: stage.id, status: "submitted" }, transaction }
      );
    }

    await notifyUser(
      student.id,
      {
        type: action === DECISIONS.CORRECTION ? "correction_required" : `stage_${toStatus}`,
        title:
          action === DECISIONS.APPROVE
            ? `${stage.office.name} cleared you`
            : action === DECISIONS.REJECT
            ? `${stage.office.name} rejected your clearance`
            : `${stage.office.name} needs a correction`,
        message:
          action === DECISIONS.APPROVE
            ? `${stage.office.name} has ${STATUS_LABELS[toStatus]} your clearance.${text ? ` Comment: ${text}` : ""}`
            : text,
        link: action === DECISIONS.APPROVE ? "/clearance/progress" : "/clearance/feedback",
      },
      transaction
    );

    if (toStatus === STAGE_STATUS.APPROVED) {
      await advanceWorkflow(application, student, transaction);
    } else if (toStatus === STAGE_STATUS.REJECTED) {
      await application.update({ status: APPLICATION_STATUS.REJECTED }, { transaction });
    }

    // The next office (if any) needs to see the request appear in its queue
    const nextStage = await ClearanceStage.findOne({
      where: { applicationId: application.id, status: STAGE_STATUS.PENDING },
      attributes: ["officeId"],
      transaction,
    });
    await publishChange(
      application,
      [stage.officeId, ...(nextStage ? [nextStage.officeId] : [])],
      student.department,
      transaction
    );

    await logAudit(
      {
        req,
        action: `stage.${action === DECISIONS.CORRECTION ? "correction_requested" : toStatus}`,
        entityType: "clearance_stage",
        entityId: stage.id,
        details: { office: stage.office.code, studentId: student.studentId, comment: text || undefined },
      },
      transaction
    );

    return stage.id;
  });
}
