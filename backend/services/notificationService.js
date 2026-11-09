import { Op } from "sequelize";
import { Notification, User } from "../models/index.js";

// Creates one notification for one user
export async function notifyUser(userId, { type, title, message, link = null }, transaction) {
  return Notification.create({ userId, type, title, message, link }, { transaction });
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

  return Notification.bulkCreate(
    officers.map((o) => ({ userId: o.id, type, title, message, link })),
    { transaction }
  );
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
