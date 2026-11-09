"use strict";

// Indexes for the queries the system runs most often, so they stay fast as
// the number of students and requests grows (scalability).

const INDEXES = [
  // Officer work queue: "stages of my office with these statuses"
  { table: "clearance_stages", fields: ["officeId", "status"], name: "clearance_stages_office_status" },
  // Loading an application's stages in workflow order
  { table: "clearance_stages", fields: ["applicationId", "sequence"], name: "clearance_stages_application_sequence" },
  // "The student's current request"
  { table: "clearance_applications", fields: ["userId", "status"], name: "clearance_applications_user_status" },
  { table: "clearance_documents", fields: ["stageId"], name: "clearance_documents_stage" },
  // Officer processing history
  { table: "clearance_stage_events", fields: ["actorId", "createdAt"], name: "clearance_stage_events_actor_created" },
  // Notification list, newest first
  { table: "notifications", fields: ["userId", "createdAt"], name: "notifications_user_created" },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const index of INDEXES) {
      await queryInterface.addIndex(index.table, index.fields, { name: index.name });
    }
  },

  async down(queryInterface) {
    for (const index of INDEXES) {
      await queryInterface.removeIndex(index.table, index.name);
    }
  },
};
