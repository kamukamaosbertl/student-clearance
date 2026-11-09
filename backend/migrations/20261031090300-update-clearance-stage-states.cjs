"use strict";

// Replaces the stage status enum with the transaction states listed in
// section 10.0 of the project plan:
//   waiting             - earlier offices have not finished yet
//   pending             - in the office's work queue
//   under_review        - an officer has opened it
//   approved            - office cleared the student
//   rejected            - office refused clearance (student may resubmit)
//   correction_required - office asked for corrections / more information
//   resubmitted         - student responded to a correction or rejection
//   not_required        - optional office that does not apply to the student
//
// Also records who decided the stage and when it reached the office queue.

const NEW_STATES = [
  "waiting",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "correction_required",
  "resubmitted",
  "not_required",
];

const OLD_STATES = ["pending", "submitted", "under_review", "cleared", "rejected", "not_required"];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const q = queryInterface.sequelize;

    await q.transaction(async (transaction) => {
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status DROP DEFAULT;`, { transaction });
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status TYPE VARCHAR(32);`, { transaction });
      await q.query(`DROP TYPE IF EXISTS "enum_clearance_stages_status";`, { transaction });

      // Map old values to the new names
      await q.query(`UPDATE clearance_stages SET status = 'approved' WHERE status = 'cleared';`, { transaction });
      await q.query(`UPDATE clearance_stages SET status = 'pending' WHERE status = 'submitted';`, { transaction });

      await q.query(
        `CREATE TYPE "enum_clearance_stages_status" AS ENUM (${NEW_STATES.map((s) => `'${s}'`).join(", ")});`,
        { transaction }
      );
      await q.query(
        `ALTER TABLE clearance_stages ALTER COLUMN status TYPE "enum_clearance_stages_status" USING status::"enum_clearance_stages_status";`,
        { transaction }
      );
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status SET DEFAULT 'waiting';`, { transaction });

      await queryInterface.addColumn(
        "clearance_stages",
        "sequence",
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction }
      );
      await queryInterface.addColumn(
        "clearance_stages",
        "queuedAt",
        { type: Sequelize.DATE, allowNull: true },
        { transaction }
      );
      await queryInterface.addColumn(
        "clearance_stages",
        "decidedBy",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: "users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "clearance_stages",
        "decidedAt",
        { type: Sequelize.DATE, allowNull: true },
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    const q = queryInterface.sequelize;

    await q.transaction(async (transaction) => {
      for (const column of ["decidedAt", "decidedBy", "queuedAt", "sequence"]) {
        await queryInterface.removeColumn("clearance_stages", column, { transaction });
      }
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status DROP DEFAULT;`, { transaction });
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status TYPE VARCHAR(32);`, { transaction });
      await q.query(`DROP TYPE IF EXISTS "enum_clearance_stages_status";`, { transaction });
      await q.query(`UPDATE clearance_stages SET status = 'cleared' WHERE status = 'approved';`, { transaction });
      await q.query(
        `UPDATE clearance_stages SET status = 'pending' WHERE status IN ('waiting', 'correction_required', 'resubmitted');`,
        { transaction }
      );
      await q.query(
        `CREATE TYPE "enum_clearance_stages_status" AS ENUM (${OLD_STATES.map((s) => `'${s}'`).join(", ")});`,
        { transaction }
      );
      await q.query(
        `ALTER TABLE clearance_stages ALTER COLUMN status TYPE "enum_clearance_stages_status" USING status::"enum_clearance_stages_status";`,
        { transaction }
      );
      await q.query(`ALTER TABLE clearance_stages ALTER COLUMN status SET DEFAULT 'pending';`, { transaction });
    });
  },
};
