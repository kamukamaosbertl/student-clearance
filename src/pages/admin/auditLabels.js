// Plain-English wording for audit log actions
const LABELS = {
  "auth.login": "logged in",
  "auth.login_failed": "failed to log in",
  "auth.password_changed": "changed their password",
  "clearance.submitted": "submitted a clearance request",
  "clearance.resubmitted": "resubmitted a clearance stage",
  "stage.approved": "approved a clearance stage",
  "stage.rejected": "rejected a clearance stage",
  "stage.correction_requested": "requested a correction",
  "document.viewed": "viewed a document",
  "user.created": "created a user account",
  "user.updated": "updated a user account",
  "user.password_reset": "reset a user's password",
  "office.updated": "changed office settings",
  "report.exported": "exported the clearance report",
};

export function describeAudit(log) {
  const label = LABELS[log.action] || log.action;
  const office = log.details?.office ? ` (${log.details.office})` : "";
  const student = log.details?.studentId ? ` for ${log.details.studentId}` : "";
  return `${label}${office}${student}`;
}

export const AUDIT_FILTERS = [
  { key: "", label: "All" },
  { key: "auth.", label: "Logins" },
  { key: "clearance.", label: "Student submissions" },
  { key: "stage.", label: "Officer decisions" },
  { key: "user.", label: "User management" },
  { key: "office.", label: "Configuration" },
  { key: "document.", label: "Document access" },
];
