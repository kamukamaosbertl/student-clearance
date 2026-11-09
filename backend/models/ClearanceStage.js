import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { STAGE_STATUS } from "../utils/constants.js";

// One office's part of a clearance request (section 10.0 stage states).
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

    // Copied from the office when the application is created, so later
    // changes to office order don't reshuffle requests already in progress
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM(...Object.values(STAGE_STATUS)),
      allowNull: false,
      defaultValue: STAGE_STATUS.WAITING,
    },

    // Latest comment from the officer (shown to the student)
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // When the stage last entered the office's work queue
    queuedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    decidedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    decidedAt: {
      type: DataTypes.DATE,
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
