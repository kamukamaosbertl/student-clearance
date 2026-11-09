import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import api, { apiErrorMessage } from "../api/client";
import { formatDateTime, timeAgo } from "../utils/status";

// Section 7.10 — notifications page, shared by students and officers
export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    window.dispatchEvent(new Event("notifications:changed"));
    load();
  }

  async function open(notification) {
    if (!notification.isRead) {
      await api.patch(`/notifications/${notification.id}/read`);
      window.dispatchEvent(new Event("notifications:changed"));
    }
    if (notification.link) navigate(notification.link);
    else load();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        description="Updates about clearance requests and anything that needs your action."
      />

      <Card className="w-[760px] max-w-full gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-[13.5px] text-navy-soft">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllRead} className="px-3 py-1.5 text-[13px]">
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">Loading…</p>
        ) : error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : notifications.length === 0 ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">No notifications yet.</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={[
                    "flex w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-surface",
                    n.isRead ? "" : "bg-green-bg/40",
                  ].join(" ")}
                >
                  <span
                    className={["mt-1.5 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-teal"].join(" ")}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-navy">{n.title}</span>
                    <span className="text-[13.5px] text-body">{n.message}</span>
                    <span className="text-[12px] text-navy-soft" title={formatDateTime(n.createdAt)}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
