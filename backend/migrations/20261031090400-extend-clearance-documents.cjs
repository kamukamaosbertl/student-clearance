"use strict";

// Keeps the file's type and size so officers can see them and the server
// can send the right Content-Type when a document is viewed.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clearance_documents", "mimeType", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clearance_documents", "fileSize", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clearance_documents", "fileSize");
    await queryInterface.removeColumn("clearance_documents", "mimeType");
  },
};
