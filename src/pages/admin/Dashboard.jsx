import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import api, { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useLiveEvent } from "../../context/LiveEventsContext";
import { timeAgo } from "../../utils/status";
import { describeAudit } from "./auditLabels";

// Administrator dashboard (section 6.7) — overall numbers, where requests
// are piling up, and the latest system activity.
export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get("/admin/overview")
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  useEffect(load, [load]);
  useLiveEvent("clearance.changed", load);

  const stats = data
    ? [
        { label: "Students", value: data.users.student },
        { label: "Officers", value: data.users.officer },
        { label: "Clearances in progress", value: data.applications.in_progress },
        { label: "Completed", value: data.applications.completed },
        { label: "Rejected", value: data.applications.rejected },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Dashboard"
        description={`Welcome, ${user?.fullName || "Administrator"}. Here's how clearance is moving across the university.`}
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-[26px] font-bold text-navy">{stat.value}</p>
                <p className="text-[13px] text-navy-soft">{stat.label}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between px-6 pt-5">
              <h3 className="text-[15px] font-semibold text-navy">Office workload</h3>
              <Link to="/admin/reports" className="text-[13px] font-semibold text-teal hover:underline">
                Full report →
              </Link>
            </div>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                  <th className="px-6 py-3 font-semibold">Office</th>
                  <th className="px-6 py-3 font-semibold">In queue</th>
                  <th className="px-6 py-3 font-semibold">Awaiting student</th>
                  <th className="px-6 py-3 font-semibold">Oldest waiting</th>
                </tr>
              </thead>
              <tbody>
                {data.offices.map((row) => (
                  <tr key={row.office.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-[14px] font-medium text-navy">{row.office.name}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.inQueue}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">{row.correctionRequired + row.rejected}</td>
                    <td className="px-6 py-3 text-[14px] text-navy-soft">
                      {row.inQueue ? `${row.oldestWaitingDays} day${row.oldestWaitingDays === 1 ? "" : "s"}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-navy">Recent activity</h3>
              <Link to="/admin/audit" className="text-[13px] font-semibold text-teal hover:underline">
                All activity →
              </Link>
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="text-[13.5px] text-navy-soft">No activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.recentActivity.map((log) => (
                  <li key={log.id} className="flex justify-between gap-4 text-[13.5px]">
                    <span className="text-navy">
                      <span className="font-semibold">{log.user?.fullName || "Unknown user"}</span> {describeAudit(log)}
                    </span>
                    <span className="shrink-0 text-navy-soft">{timeAgo(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
