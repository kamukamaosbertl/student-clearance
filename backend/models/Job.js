import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// A message in the job queue (see services/jobQueue.js)
const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // email.send | reminders.overdue | sessions.cleanup | ...
    type: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },

    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },

    status: {
      type: DataTypes.ENUM("queued", "running", "done", "failed"),
      allowNull: false,
      defaultValue: "queued",
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },

    // Not processed before this time (used for retries and scheduling)
    runAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    lockedAt: { type: DataTypes.DATE, allowNull: true },
    lockedBy: { type: DataTypes.STRING(80), allowNull: true },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "jobs",
    timestamps: true,
  }
);

export default Job;
