"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint("clearance_stages", {
      fields: ["applicationId", "officeId"],
      type: "unique",
      name: "unique_application_office_stage",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "clearance_stages",
      "unique_application_office_stage"
    );
  },
};