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

    documentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "submitted",
        "approved",
        "rejected"
      ),
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