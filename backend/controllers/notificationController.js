import { listForUser, markRead } from "../services/notificationService.js";

// GET /api/notifications?unread=true
export async function getNotifications(req, res) {
  const { items, unreadCount } = await listForUser(req.user.id, { unreadOnly: req.query.unread === "true" });
  res.json({
    unreadCount,
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
  });
}

// PATCH /api/notifications/:id/read
export async function readOne(req, res) {
  const id = parseInt(req.params.id, 10);
  await markRead(req.user.id, [id]);
  res.json({ message: "Marked as read." });
}

// PATCH /api/notifications/read-all
export async function readAll(req, res) {
  const count = await markRead(req.user.id);
  res.json({ message: `${count} notification(s) marked as read.` });
}
