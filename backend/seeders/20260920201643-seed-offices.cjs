"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("offices", [
      {
        name: "Finance",
        code: "FIN",
        slug: "finance",
        sequence: 1,
        requiresDocuments: true,
        description: "Handles student financial clearance.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Library",
        code: "LIB",
        slug: "library",
        sequence: 2,
        requiresDocuments: true,
        description: "Handles library clearance and outstanding materials.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Department",
        code: "DEPT",
        slug: "department",
        sequence: 3,
        requiresDocuments: true,
        description: "Handles academic and departmental clearance.",
        isRequired: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Student Affairs",
        code: "SA",
        slug: "studentAffairs",
        sequence: 4,
        requiresDocuments: true,
        description: "Handles student affairs clearance.",
        isRequired: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Academic Registrar",
        code: "AR",
        slug: "registrar",
        sequence: 5,
        requiresDocuments: false,
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