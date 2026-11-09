import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// One row per logged-in browser (server-side session store)
const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ipAddress: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },

    userAgent: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    // Updated (at most once a minute) on each request — drives the idle timeout
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // Absolute end of the session, however active the user is
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // logout | logout_all | password_changed | admin | idle_timeout | account_disabled
    revokedReason: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
  }
);

export default Session;
