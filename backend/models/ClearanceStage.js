import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ClearanceStage = sequelize.define(
  "ClearanceStage",
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

    officeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "submitted",
        "under_review",
        "cleared",
        "rejected",
        "not_required"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    clearedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "clearance_stages",
    timestamps: true,
  }
);

export default ClearanceStage;