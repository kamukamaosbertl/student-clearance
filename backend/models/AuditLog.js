import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Who did it (null for system actions or failed logins)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    action: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },

    entityType: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },

    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
  }
);

export default AuditLog;
