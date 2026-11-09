import { AuditLog } from "../models/index.js";

// Records an important action in the audit trail (section 7.13).
// Never throws — a failure to write the audit log is reported in the
// console but must not break the action the user was performing.
// Pass `transaction` so the log is rolled back together with the action.
export async function logAudit(
  { req, userId, action, entityType = null, entityId = null, details = null },
  transaction
) {
  try {
    await AuditLog.create(
      {
        userId: userId ?? req?.user?.id ?? null,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req?.ip ?? null,
      },
      { transaction }
    );
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
}
