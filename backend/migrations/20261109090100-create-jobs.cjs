"use strict";

// Message queue (course L9: Message-Oriented Middleware).
//
// The API servers put messages ("jobs") in this table and return to the
// user immediately; a separate worker process takes them off the queue and
// processes them later (sending email, reminders, clean-up). Several
// workers can share the queue safely because each one claims a job with
// SELECT ... FOR UPDATE SKIP LOCKED.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("jobs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      status: {
        type: Sequelize.ENUM("queued", "running", "done", "failed"),
        allowNull: false,
        defaultValue: "queued",
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      runAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      lockedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lockedBy: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      lastError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      completedAt: {
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

    // The worker always looks for "queued jobs that are due, oldest first"
    await queryInterface.addIndex("jobs", ["status", "runAt"]);
    await queryInterface.addIndex("jobs", ["type", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("jobs");
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_jobs_status";`);
  },
};
