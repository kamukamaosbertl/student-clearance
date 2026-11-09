"use strict";

// Shared rate-limit counters. With one server, counting login attempts in
// memory is fine. With several servers behind a load balancer (or several
// cluster workers) each would keep its own count and an attacker would get
// 10 tries PER SERVER — so the counters live in the shared database.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rate_limits", {
      key: {
        type: Sequelize.STRING(200),
        primaryKey: true,
        allowNull: false,
      },
      hits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      resetAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("rate_limits", ["resetAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rate_limits");
  },
};
