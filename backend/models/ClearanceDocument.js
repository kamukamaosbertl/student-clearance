import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ClearanceDocument = sequelize.define(
  "ClearanceDocument",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    stageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // "initial" for documents sent with the request, "correction" for
    // documents sent when responding to an officer
    documentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Original file name as uploaded by the student (display only)
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Random name of the file inside the uploads folder. The column is
    // called storageKey in the migration — the old model called it
    // filePath, which didn't match the table and would fail on insert.
    storageKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("submitted", "approved", "rejected"),
      allowNull: false,
      defaultValue: "submitted",
    },

    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "clearance_documents",
    timestamps: true,
  }
);

export default ClearanceDocument;
