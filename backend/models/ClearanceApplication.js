import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ClearanceApplication = sequelize.define(
  "ClearanceApplication",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "in_progress",
        "completed",
        "rejected"
      ),
      allowNull: false,
      defaultValue: "draft",
    },

    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "clearance_applications",
    timestamps: true,
  }
);

export default ClearanceApplication;