"use strict";

// Stores the information the student submits with the clearance request
// (section 7.3 "Information Submission").

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clearance_applications", "contactEmail", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_applications", "phone", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_applications", "yearOfStudy", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_applications", "graduationYear", {
      type: Sequelize.STRING(4),
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_applications", "reason", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_applications", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    for (const column of ["notes", "reason", "graduationYear", "yearOfStudy", "phone", "contactEmail"]) {
      await queryInterface.removeColumn("clearance_applications", column);
    }
  },
};
