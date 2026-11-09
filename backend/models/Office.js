import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Office = sequelize.define(
  "Office",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Stable key shared with the frontend (finance, library, department, ...)
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    // Position of this office in the clearance workflow (1 = first)
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // false for the Academic Registrar, which finalizes rather than
    // collecting documents from the student
    requiresDocuments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Optional offices (isRequired = false) are skipped when the student
    // does not submit anything for them
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "offices",
    timestamps: true,
  }
);

export default Office;
