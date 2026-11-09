"use strict";

// History of every state change on a clearance stage, together with the
// comment that went with it. Covers the "Comments/Feedback" entity in
// section 13.0 and the requirement in section 10.0 to keep "the current
// state and relevant history of each clearance stage".

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clearance_stage_events", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      stageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "clearance_stages", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      fromStatus: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      toStatus: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("clearance_stage_events", ["stageId"]);
    await queryInterface.addIndex("clearance_stage_events", ["actorId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("clearance_stage_events");
  },
};
