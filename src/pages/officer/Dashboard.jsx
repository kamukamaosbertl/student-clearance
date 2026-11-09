import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useLiveEvent } from "../../context/LiveEventsContext";
import { STAGE_LABELS } from "../../utils/status";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function QueueTable({ rows, showOverdue }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
          <th className="py-2 pr-4 font-semibold">Student</th>
          <th className="py-2 pr-4 font-semibold">Reg. no.</th>
          <th className="py-2 pr-4 font-semibold">Waiting</th>
          <th className="py-2 pr-4 font-semibold">Status</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.stageId} className="border-b border-border last:border-0">
            <td className="py-3 pr-4 text-[14px] font-medium text-navy">{row.student.fullName}</td>
            <td className="py-3 pr-4 text-[14px] text-navy-soft">{row.student.studentId}</td>
            <td className="py-3 pr-4 text-[14px] text-navy-soft">
              {row.daysWaiting === 0 ? "Today" : `${row.daysWaiting} day${row.daysWaiting === 1 ? "" : "s"}`}
            </td>
            <td className="py-3 pr-4">
              {showOverdue ? (
                <StatusBadge status="overdue">Overdue</StatusBadge>
              ) : (
                <StatusBadge status={row.status}>{STAGE_LABELS[row.status]}</StatusBadge>
              )}
            </td>
            <td className="py-3 text-right">
              <Link to={`/officer/request/${row.stageId}`} className="text-[13.5px] font-semibold text-teal hover:underline">
                Open →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get("/officer/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  useEffect(load, [load]);
  // New requests appear without refreshing the page
  useLiveEvent("clearance.changed", load);

  const officeName = data?.office?.name || user?.office?.name || "";
  const stats = data
    ? [
        { label: "Pending review", value: data.stats.pending },
        { label: "Correction requested", value: data.stats.correctionRequested },
        { label: "Approved this semester", value: data.stats.approvedThisSemester },
        { label: "Rejected", value: data.stats.rejected },
      ]
    : [];

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer${officeName ? ` · ${officeName}` : ""}`}
        title="Dashboard"
        description={`${getTimeOfDayGreeting()}, ${user?.fullName?.split(" ")[0] || "officer"} — here's your queue and what needs attention.`}
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-[26px] font-bold text-navy">{stat.value}</p>
                <p className="text-[13px] text-navy-soft">{stat.label}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-navy">Needs attention today</h3>
            <p className="mb-2 text-[13px] text-navy-soft">
              Requests sitting in your queue for {data.overdueDays} days or more.
            </p>
            {data.needsAttention.length === 0 ? (
              <p className="text-[13.5px] text-navy-soft">Nothing overdue — nice work.</p>
            ) : (
              <QueueTable rows={data.needsAttention} showOverdue />
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-navy">Next in your queue</h3>
              <Link to="/officer/queue" className="text-[13px] font-semibold text-teal hover:underline">
                View all →
              </Link>
            </div>
            {data.nextUp.length === 0 ? (
              <p className="text-[13.5px] text-navy-soft">Your queue is empty.</p>
            ) : (
              <QueueTable rows={data.nextUp} />
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
