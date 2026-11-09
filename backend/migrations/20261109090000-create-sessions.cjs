"use strict";

// Server-side session store (course L1: "server-side functionality is
// needed to ... manage sessions").
//
// Every login creates one row here. The JWT the browser holds only carries
// the session id, so the SERVER decides whether the session is still valid:
// logging out, "log out of all devices", an administrator ending a session
// or an idle timeout all take effect immediately, on every server behind
// the load balancer, because they all read this same table.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ipAddress: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
      lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revokedReason: {
        type: Sequelize.STRING(40),
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

    await queryInterface.addIndex("sessions", ["userId"]);
    await queryInterface.addIndex("sessions", ["expiresAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sessions");
  },
};
