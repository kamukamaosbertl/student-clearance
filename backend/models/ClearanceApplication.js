import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// The long-duration clearance transaction (section 9.0). One row per
// clearance request; it stays "in_progress" while it moves through the
// offices and only becomes "completed" when the Registrar finalizes it.
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
      type: DataTypes.ENUM("draft", "in_progress", "completed", "rejected"),
      allowNull: false,
      defaultValue: "draft",
    },

    // Information submitted by the student (section 7.3)
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    yearOfStudy: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    graduationYear: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },

    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
