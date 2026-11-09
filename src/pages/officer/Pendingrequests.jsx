import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { STAGE_LABELS, formatDate } from "../../utils/status";

// Filters map to GET /api/officer/requests?status=...
const FILTERS = [
  { key: "actionable", label: "Needs action" },
  { key: "correction_required", label: "Correction sent" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function PendingRequests() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("actionable");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    api
      .get("/officer/requests", { params: { status: filter } })
      .then(({ data }) => {
        setRequests(data.requests);
        setError("");
      })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filter]);

  const officeName = user?.office?.name || "your office";

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Officer · ${officeName}`}
        title="Pending requests"
        description={`Clearance requests assigned to the ${officeName} stage. Oldest requests needing action are listed first.`}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              filter === f.key ? "border-teal bg-teal text-white" : "border-border bg-white text-navy-soft hover:text-navy",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">Loading…</p>
        ) : error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : requests.length === 0 ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">No requests here.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                <th className="px-6 py-3 font-semibold">Student</th>
                <th className="px-6 py-3 font-semibold">Programme</th>
                <th className="px-6 py-3 font-semibold">In queue since</th>
                <th className="px-6 py-3 font-semibold">Documents</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.stageId} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-semibold text-navy">{req.student.fullName}</p>
                    <p className="text-[12.5px] text-navy-soft">{req.student.studentId}</p>
                  </td>
                  <td className="px-6 py-4 text-[14px] text-navy-soft">{req.student.programme || "—"}</td>
                  <td className="px-6 py-4 text-[14px] text-navy-soft">{formatDate(req.queuedAt)}</td>
                  <td className="px-6 py-4 text-[14px] text-navy-soft">{req.documentCount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status}>{STAGE_LABELS[req.status]}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/officer/request/${req.stageId}`} className="text-[13.5px] font-semibold text-teal hover:underline">
                      Open →
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
