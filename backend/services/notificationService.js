import { Op } from "sequelize";
import { Notification, User } from "../models/index.js";
import { publish } from "./eventBus.js";
import { enqueue } from "./jobQueue.js";

// Each notification is delivered three ways:
//  1. saved in the notifications table (the in-app list)
//  2. pushed live to the user's open browser tabs (event bus + SSE)
//  3. emailed — as a job on the message queue, so the request doesn't wait
//     for the mail server; the worker process sends it
// All three are part of the caller's transaction: if it rolls back, nothing
// is shown, pushed or emailed.
async function deliver(userIds, { type, title, message }, transaction) {
  if (userIds.length === 0) return;
  await publish("notification", { audience: { userIds }, type, title }, transaction);
  for (const userId of userIds) {
    await enqueue("email.send", { userId, subject: title, text: message }, { transaction });
  }
}

// Creates one notification for one user
export async function notifyUser(userId, { type, title, message, link = null }, transaction) {
  const notification = await Notification.create({ userId, type, title, message, link }, { transaction });
  await deliver([userId], { type, title, message }, transaction);
  return notification;
}

// Notifies every active officer of an office (e.g. "a new request is in your queue").
// For the Department office, only officers of the student's department are
// notified when such officers exist.
export async function notifyOffice(officeId, { type, title, message, link = null, department = null }, transaction) {
  const where = { role: "officer", officeId, isActive: true };

  let officers = await User.findAll({ where, attributes: ["id", "department"], transaction });

  if (department) {
    const sameDepartment = officers.filter(
      (o) => o.department && o.department.toLowerCase() === department.toLowerCase()
    );
    const general = officers.filter((o) => !o.department);
    if (sameDepartment.length > 0 || general.length > 0) {
      officers = [...sameDepartment, ...general];
    }
  }

  if (officers.length === 0) return [];

  const created = await Notification.bulkCreate(
    officers.map((o) => ({ userId: o.id, type, title, message, link })),
    { transaction }
  );
  await deliver(officers.map((o) => o.id), { type, title, message }, transaction);
  return created;
}

export async function listForUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const [items, unreadCount] = await Promise.all([
    Notification.findAll({ where, order: [["createdAt", "DESC"]], limit }),
    Notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount };
}

export async function markRead(userId, ids) {
  const where = { userId, isRead: false };
  if (ids) where.id = { [Op.in]: ids };
  const [count] = await Notification.update({ isRead: true }, { where });
  return count;
}
