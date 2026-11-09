import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import api, { apiErrorMessage } from "../../api/client";
import { ROLE_LABELS, formatDateTime, timeAgo } from "../../utils/status";

// Short description of the browser from its User-Agent string
function describeAgent(userAgent = "") {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
    ? "Chrome"
    : /Firefox\//.test(userAgent)
    ? "Firefox"
    : /Safari\//.test(userAgent)
    ? "Safari"
    : userAgent
    ? "Other client"
    : "Unknown";
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Mac OS/.test(userAgent)
    ? "macOS"
    : /Linux/.test(userAgent)
    ? "Linux"
    : "";
  return system ? `${browser} on ${system}` : browser;
}

// Server-side sessions: who is logged in right now, from where, and the
// ability to end a session immediately (on every server).
export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/sessions");
      setSessions(data.sessions);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  async function endSession(id) {
    setBusyId(id);
    try {
      await api.delete(`/admin/sessions/${id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function endAllForUser(userId) {
    setBusyId(`user-${userId}`);
    try {
      await api.post(`/admin/users/${userId}/logout-all`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Active sessions"
        description="Everyone logged in right now. Sessions are stored on the server, so ending one logs that browser out immediately — on every server."
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        <p className="px-6 pt-4 text-[12.5px] text-navy-soft">
          {sessions.length} active session{sessions.length === 1 ? "" : "s"} · inactive sessions end automatically
        </p>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
              <th className="px-6 py-3 font-semibold">User</th>
              <th className="px-6 py-3 font-semibold">Device</th>
              <th className="px-6 py-3 font-semibold">IP address</th>
              <th className="px-6 py-3 font-semibold">Signed in</th>
              <th className="px-6 py-3 font-semibold">Last active</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <p className="text-[14px] font-semibold text-navy">{session.user?.fullName}</p>
                  <p className="text-[12.5px] text-navy-soft">
                    {ROLE_LABELS[session.user?.role]} · {session.user?.studentId || session.user?.email}
                  </p>
                </td>
                <td className="px-6 py-3 text-[13.5px] text-navy-soft">{describeAgent(session.userAgent)}</td>
                <td className="px-6 py-3 text-[13px] text-navy-soft">{session.ipAddress || "—"}</td>
                <td className="px-6 py-3 text-[13px] text-navy-soft">{formatDateTime(session.createdAt)}</td>
                <td className="px-6 py-3 text-[13px] text-navy-soft">{timeAgo(session.lastSeenAt)}</td>
                <td className="whitespace-nowrap px-6 py-3 text-right">
                  {session.current ? (
                    <span className="text-[12.5px] font-semibold text-teal-dark">This session</span>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        disabled={busyId === session.id}
                        onClick={() => endSession(session.id)}
                        className="text-[13px] font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        End session
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `user-${session.user?.id}`}
                        onClick={() => endAllForUser(session.user?.id)}
                        className="text-[13px] font-semibold text-navy-soft hover:underline disabled:opacity-50"
                      >
                        All devices
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
