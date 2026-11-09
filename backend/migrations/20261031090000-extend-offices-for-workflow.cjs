"use strict";

// Adds the columns the workflow engine needs on each office:
//  - slug:              stable key the frontend uses (finance, library, ...)
//  - sequence:          order of the office in the clearance workflow (section 9.0)
//  - requiresDocuments: false for the Academic Registrar, which finalizes
//                       clearance instead of collecting documents

const DEFAULTS = {
  FIN: { slug: "finance", sequence: 1, requiresDocuments: true },
  LIB: { slug: "library", sequence: 2, requiresDocuments: true },
  DEPT: { slug: "department", sequence: 3, requiresDocuments: true },
  SA: { slug: "studentAffairs", sequence: 4, requiresDocuments: true },
  AR: { slug: "registrar", sequence: 5, requiresDocuments: false },
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("offices", "slug", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("offices", "sequence", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("offices", "requiresDocuments", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Backfill the five offices created by the seeder
    for (const [code, values] of Object.entries(DEFAULTS)) {
      await queryInterface.bulkUpdate("offices", values, { code });
    }

    // Any other office that already exists gets a slug from its code
    await queryInterface.sequelize.query(
      `UPDATE offices SET slug = LOWER(code) WHERE slug IS NULL;`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("offices", "requiresDocuments");
    await queryInterface.removeColumn("offices", "sequence");
    await queryInterface.removeColumn("offices", "slug");
  },
};
