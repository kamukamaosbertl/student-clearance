"use strict";

// Links every officer to the office whose stages they are allowed to process
// (section 16.0: "a Finance Officer should only be able to process
// Finance-related clearance stages").

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "officeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "offices", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("users", "lastLoginAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Backfill officers that were already imported from the staff CSV:
    // match their department to an office name ("Finance", "Library", ...)
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET "officeId" = o.id
      FROM offices o
      WHERE u.role = 'officer'
        AND u."officeId" IS NULL
        AND LOWER(u.department) = LOWER(o.name);
    `);

    // Officers whose department is an academic department
    // (e.g. "Software Engineering") belong to the Department office
    await queryInterface.sequelize.query(`
      UPDATE users
      SET "officeId" = (SELECT id FROM offices WHERE code = 'DEPT')
      WHERE role = 'officer' AND "officeId" IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "lastLoginAt");
    await queryInterface.removeColumn("users", "officeId");
  },
};
