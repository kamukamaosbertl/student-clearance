import fs from "fs";
import path from "path";
import { ClearanceDocument, ClearanceStage, ClearanceApplication, User } from "../models/index.js";
import { STAGE_STATUS } from "../utils/constants.js";
import { notFound } from "../utils/httpError.js";
import { UPLOAD_DIR } from "../middleware/upload.js";
import { departmentScope, getDepartmentOfficeId } from "../services/workflowService.js";
import { logAudit } from "../services/auditService.js";

// GET /api/documents/:id — streams a supporting document.
// Students may open their own documents, officers only documents of
// stages in their office, administrators any document.
export async function downloadDocument(req, res) {
  const doc = await ClearanceDocument.findByPk(req.params.id, {
    include: [
      {
        model: ClearanceStage,
        as: "stage",
        include: [
          {
            model: ClearanceApplication,
            as: "application",
            include: [{ model: User, as: "user", attributes: ["id", "department"] }],
          },
        ],
      },
    ],
  });

  // Same 404 for "doesn't exist" and "not yours" so ids can't be probed
  if (!doc) throw notFound("Document not found.");

  const user = req.user;
  const stage = doc.stage;
  const owner = stage.application.user;
  let allowed = false;

  if (user.role === "admin") allowed = true;
  if (user.role === "student") allowed = owner.id === user.id;
  if (user.role === "officer") {
    allowed = stage.officeId === user.officeId && stage.status !== STAGE_STATUS.WAITING;
    const department = departmentScope(user, await getDepartmentOfficeId());
    if (allowed && department) {
      allowed = (owner.department || "").toLowerCase() === department.toLowerCase();
    }
  }

  if (!allowed) throw notFound("Document not found.");

  const filePath = path.join(UPLOAD_DIR, path.basename(doc.storageKey));
  if (!fs.existsSync(filePath)) throw notFound("The file is missing from storage.");

  if (user.role !== "student") {
    await logAudit({ req, action: "document.viewed", entityType: "clearance_document", entityId: doc.id });
  }

  const safeName = doc.fileName.replace(/[^\w.\- ]+/g, "_");
  res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(filePath);
}
