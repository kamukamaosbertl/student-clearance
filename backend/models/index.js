import User from "./User.js";
import Office from "./Office.js";
import ClearanceApplication from "./ClearanceApplication.js";
import ClearanceStage from "./ClearanceStage.js";
import ClearanceDocument from "./ClearanceDocument.js";

// User → Applications
User.hasMany(ClearanceApplication, {
  foreignKey: "userId",
  as: "applications",
});

ClearanceApplication.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Application → Stages
ClearanceApplication.hasMany(ClearanceStage, {
  foreignKey: "applicationId",
  as: "stages",
});

ClearanceStage.belongsTo(ClearanceApplication, {
  foreignKey: "applicationId",
  as: "application",
});

// Office → Stages
Office.hasMany(ClearanceStage, {
  foreignKey: "officeId",
  as: "stages",
});

ClearanceStage.belongsTo(Office, {
  foreignKey: "officeId",
  as: "office",
});

// Application → Documents
ClearanceApplication.hasMany(ClearanceDocument, {
  foreignKey: "applicationId",
  as: "documents",
});

ClearanceDocument.belongsTo(ClearanceApplication, {
  foreignKey: "applicationId",
  as: "application",
});

// Stage → Documents
ClearanceStage.hasMany(ClearanceDocument, {
  foreignKey: "stageId",
  as: "documents",
});

ClearanceDocument.belongsTo(ClearanceStage, {
  foreignKey: "stageId",
  as: "stage",
});

export {
  User,
  Office,
  ClearanceApplication,
  ClearanceStage,
  ClearanceDocument,
};