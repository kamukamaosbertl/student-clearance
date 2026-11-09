import { Op } from "sequelize";
import {
  Office,
  User,
  ClearanceApplication,
  ClearanceStage,
  ClearanceDocument,
  StageEvent,
} from "../models/index.js";
import { APPLICATION_STATUS } from "../utils/constants.js";
import { validateClearanceInfo, clean } from "../utils/validators.js";
import { badRequest } from "../utils/httpError.js";
import { serializeApplication, serializeOffice } from "../utils/serializers.js";
import { submitApplication, resubmitStage } from "../services/workflowService.js";

// Everything needed to show a full application with its stages
export const applicationInclude = [
  {
    model: ClearanceStage,
    as: "stages",
    include: [
      { model: Office, as: "office" },
      { model: User, as: "decider", attributes: ["id", "fullName"] },
      { model: ClearanceDocument, as: "documents" },
      {
        model: StageEvent,
        as: "events",
        include: [{ model: User, as: "actor", attributes: ["id", "fullName", "role"] }],
      },
    ],
  },
];

export const applicationOrder = [
  [{ model: ClearanceStage, as: "stages" }, "sequence", "ASC"],
  [{ model: ClearanceStage, as: "stages" }, { model: ClearanceDocument, as: "documents" }, "uploadedAt", "ASC"],
  [{ model: ClearanceStage, as: "stages" }, { model: StageEvent, as: "events" }, "createdAt", "ASC"],
];

async function loadCurrentApplication(userId) {
  return ClearanceApplication.findOne({
    where: { userId, status: { [Op.ne]: APPLICATION_STATUS.DRAFT } },
    include: applicationInclude,
    order: [["createdAt", "DESC"], ...applicationOrder],
  });
}

// GET /api/offices — offices in workflow order (any logged-in user)
export async function listOffices(req, res) {
  const offices = await Office.findAll({ where: { isActive: true }, order: [["sequence", "ASC"]] });
  res.json({ offices: offices.map(serializeOffice) });
}

// GET /api/clearance/me — the student's current clearance request (or null)
export async function getMyClearance(req, res) {
  const application = await loadCurrentApplication(req.user.id);
  res.json({ application: serializeApplication(application) });
}

// POST /api/clearance — multipart/form-data
// Fields: email, phone, yearOfStudy, graduationYear, reason, notes
// Files:  one field per office slug, e.g. finance, library, department, studentAffairs
export async function submitClearance(req, res) {
  const { values, errors } = validateClearanceInfo(req.body);
  if (Object.keys(errors).length > 0) {
    throw badRequest("Please correct the highlighted fields.", { fields: errors });
  }

  const filesBySlug = {};
  for (const file of req.files || []) {
    // Accept "finance" as well as "finance[]" style field names
    const slug = file.fieldname.replace(/\[\]$/, "");
    (filesBySlug[slug] ||= []).push(file);
  }

  await submitApplication({ req, student: req.user, info: values, filesBySlug });

  const application = await loadCurrentApplication(req.user.id);
  res.status(201).json({
    message: "Clearance request submitted.",
    application: serializeApplication(application),
  });
}

// POST /api/clearance/stages/:stageId/resubmit — multipart/form-data
// Fields: message (optional). Files: any field name.
export async function resubmitClearanceStage(req, res) {
  const stageId = parseInt(req.params.stageId, 10);
  if (!stageId) throw badRequest("Invalid stage id.");

  await resubmitStage({
    req,
    student: req.user,
    stageId,
    files: req.files || [],
    message: clean(req.body.message, 2000),
  });

  const application = await loadCurrentApplication(req.user.id);
  res.json({ message: "Resubmitted to the office.", application: serializeApplication(application) });
}
