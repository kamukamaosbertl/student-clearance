"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clearance_documents", {
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

      stageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "clearance_stages",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      documentType: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      fileName: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      storageKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "submitted",
          "approved",
          "rejected"
        ),
        allowNull: false,
        defaultValue: "submitted",
      },

      uploadedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
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
    await queryInterface.dropTable("clearance_documents");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_clearance_documents_status";'
    );
  },
};