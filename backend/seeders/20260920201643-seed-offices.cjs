"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("offices", [
      {
        name: "Finance",
        code: "FIN",
        description: "Handles student financial clearance.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Library",
        code: "LIB",
        description: "Handles library clearance and outstanding materials.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Department",
        code: "DEPT",
        description: "Handles academic and departmental clearance.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Student Affairs",
        code: "SA",
        description: "Handles student affairs clearance.",
        isRequired: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Academic Registrar",
        code: "AR",
        description: "Handles final academic clearance.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("offices", null, {});
  },
};