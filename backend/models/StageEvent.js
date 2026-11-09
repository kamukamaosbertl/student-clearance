import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Every state change on a stage plus its comment — the stage history and
// the student/officer feedback thread.
const StageEvent = sequelize.define(
  "StageEvent",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    stageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    actorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // submitted | queued | opened | approved | rejected |
    // correction_requested | resubmitted | skipped
    action: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },

    fromStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },

    toStatus: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "clearance_stage_events",
    timestamps: true,
  }
);

export default StageEvent;
