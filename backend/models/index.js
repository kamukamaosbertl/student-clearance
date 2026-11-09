import User from "./User.js";
import Office from "./Office.js";
import ClearanceApplication from "./ClearanceApplication.js";
import ClearanceStage from "./ClearanceStage.js";
import ClearanceDocument from "./ClearanceDocument.js";
import StageEvent from "./StageEvent.js";
import Notification from "./Notification.js";
import AuditLog from "./AuditLog.js";

// User → Applications
User.hasMany(ClearanceApplication, { foreignKey: "userId", as: "applications" });
ClearanceApplication.belongsTo(User, { foreignKey: "userId", as: "user" });

// Officer → Office
Office.hasMany(User, { foreignKey: "officeId", as: "officers" });
User.belongsTo(Office, { foreignKey: "officeId", as: "office" });

// Application → Stages
ClearanceApplication.hasMany(ClearanceStage, { foreignKey: "applicationId", as: "stages" });
ClearanceStage.belongsTo(ClearanceApplication, { foreignKey: "applicationId", as: "application" });

// Office → Stages
Office.hasMany(ClearanceStage, { foreignKey: "officeId", as: "stages" });
ClearanceStage.belongsTo(Office, { foreignKey: "officeId", as: "office" });

// Stage → officer who decided it
ClearanceStage.belongsTo(User, { foreignKey: "decidedBy", as: "decider" });

// Application → Documents
ClearanceApplication.hasMany(ClearanceDocument, { foreignKey: "applicationId", as: "documents" });
ClearanceDocument.belongsTo(ClearanceApplication, { foreignKey: "applicationId", as: "application" });

// Stage → Documents
ClearanceStage.hasMany(ClearanceDocument, { foreignKey: "stageId", as: "documents" });
ClearanceDocument.belongsTo(ClearanceStage, { foreignKey: "stageId", as: "stage" });

// Stage → Events (history / comments)
ClearanceStage.hasMany(StageEvent, { foreignKey: "stageId", as: "events" });
StageEvent.belongsTo(ClearanceStage, { foreignKey: "stageId", as: "stage" });
StageEvent.belongsTo(User, { foreignKey: "actorId", as: "actor" });

// User → Notifications
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// User → Audit logs
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

export {
  User,
  Office,
  ClearanceApplication,
  ClearanceStage,
  ClearanceDocument,
  StageEvent,
  Notification,
  AuditLog,
};
