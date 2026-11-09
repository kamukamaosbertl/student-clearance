import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { DECISION_LABELS, formatDateTime } from "../../utils/status";

export default function ProcessingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/officer/history")
      .then(({ data }) => setHistory(data.history))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${user?.office?.name || ""}`}
        title="Processing history"
        description="Every decision you've made, most recent first."
      />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">Loading…</p>
        ) : error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : history.length === 0 ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">You haven't recorded any decisions yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                <th className="px-6 py-3 font-semibold">Student</th>
                <th className="px-6 py-3 font-semibold">Decision</th>
                <th className="px-6 py-3 font-semibold">Comment</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-semibold text-navy">{entry.student?.fullName}</p>
                    <p className="text-[12.5px] text-navy-soft">{entry.student?.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={entry.decision}>{DECISION_LABELS[entry.decision]}</StatusBadge>
                  </td>
                  <td className="max-w-[280px] px-6 py-4 text-[13px] text-navy-soft">{entry.comment || "—"}</td>
                  <td className="px-6 py-4 text-[13.5px] text-navy-soft">{formatDateTime(entry.date)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/officer/request/${entry.stageId}`} className="text-[13px] font-semibold text-teal hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
