"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clearance_stages", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "clearance_applications",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      officeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "offices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.TEXT,
        allowNull: true,
      },

      clearedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("clearance_stages");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_clearance_stages_status";'
    );
  },
};