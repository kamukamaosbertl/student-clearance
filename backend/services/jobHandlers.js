import { Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  User,
  Office,
  ClearanceApplication,
  ClearanceStage,
  Session,
  Job,
} from "../models/index.js";
import { ACTIONABLE_STATUSES, OVERDUE_DAYS } from "../utils/constants.js";
import { sendMail } from "./mailer.js";
import { notifyOffice } from "./notificationService.js";

// What the worker does with each type of message in the queue

const DAY_MS = 24 * 60 * 60 * 1000;

export const handlers = {
  // Email a user. Students without an account email get it at the contact
  // email they gave on their clearance request.
  async "email.send"({ userId, subject, text }) {
    const user = await User.findByPk(userId, { attributes: ["id", "email", "fullName", "isActive"] });
    if (!user || !user.isActive) return "skipped: user not found or inactive";

    let to = user.email;
    if (!to) {
      const application = await ClearanceApplication.findOne({
        where: { userId, contactEmail: { [Op.ne]: null } },
        order: [["createdAt", "DESC"]],
        attributes: ["contactEmail"],
      });
      to = application?.contactEmail;
    }
    if (!to) return "skipped: no email address";

    await sendMail({
      to,
      subject: `MUST Clearance — ${subject}`,
      text: `Hello ${user.fullName},\n\n${text}\n\nLog in to MUST Clearance to see the details.\n\nThis is an automatic message.`,
    });
    return `sent to ${to}`;
  },

  // Remind each office about requests waiting longer than OVERDUE_DAYS
  // (part of managing the long-duration transaction: nothing gets forgotten)
  async "reminders.overdue"() {
    const cutoff = new Date(Date.now() - OVERDUE_DAYS * DAY_MS);
    const overdue = await ClearanceStage.findAll({
      where: { status: { [Op.in]: ACTIONABLE_STATUSES }, queuedAt: { [Op.lt]: cutoff } },
      include: [{ model: Office, as: "office", attributes: ["id", "name"] }],
      attributes: ["id", "officeId"],
    });

    const byOffice = new Map();
    for (const stage of overdue) {
      const entry = byOffice.get(stage.officeId) || { office: stage.office, count: 0 };
      entry.count++;
      byOffice.set(stage.officeId, entry);
    }

    for (const { office, count } of byOffice.values()) {
      await sequelize.transaction((transaction) =>
        notifyOffice(
          office.id,
          {
            type: "overdue_reminder",
            title: "Requests waiting too long",
            message: `${count} clearance request${count === 1 ? " has" : "s have"} been waiting in the ${office.name} queue for ${OVERDUE_DAYS} days or more.`,
            link: "/officer/dashboard",
          },
          transaction
        )
      );
    }
    return `${overdue.length} overdue request(s) in ${byOffice.size} office(s)`;
  },

  // Housekeeping: old sessions, expired rate-limit counters, finished jobs
  async "maintenance.cleanup"() {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const sessions = await Session.destroy({
      where: { [Op.or]: [{ expiresAt: { [Op.lt]: weekAgo } }, { revokedAt: { [Op.lt]: weekAgo } }] },
    });
    const [, limits] = await sequelize.query(`DELETE FROM rate_limits WHERE "resetAt" < NOW()`);
    const jobs = await Job.destroy({ where: { status: "done", completedAt: { [Op.lt]: weekAgo } } });
    return `removed ${sessions} session(s), ${limits?.rowCount ?? 0} rate-limit counter(s), ${jobs} job(s)`;
  },
};

// Jobs the worker schedules for itself, and how often they run
export const recurringJobs = [
  { type: "reminders.overdue", everyMs: (parseInt(process.env.REMINDER_INTERVAL_MINUTES, 10) || 24 * 60) * 60 * 1000 },
  { type: "maintenance.cleanup", everyMs: 60 * 60 * 1000 },
];
