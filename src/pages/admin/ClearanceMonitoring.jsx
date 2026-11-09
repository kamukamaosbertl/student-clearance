import { Fragment, useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import StatusBadge from "../../components/ui/Statusbadge";
import DocumentList from "../../components/clearance/DocumentList";
import StageHistory from "../../components/clearance/StageHistory";
import api, { apiErrorMessage } from "../../api/client";
import { APPLICATION_LABELS, STAGE_LABELS, formatDate } from "../../utils/status";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
];

// Expanded view of one clearance transaction
function ApplicationDetail({ id }) {
  const [application, setApplication] = useState(null);
  const [openStage, setOpenStage] = useState(null);

  useEffect(() => {
    api.get(`/admin/applications/${id}`).then(({ data }) => setApplication(data.application));
  }, [id]);

  if (!application) return <p className="text-[13px] text-navy-soft">Loading…</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-navy-soft">
        {application.contactEmail} · {application.phone} · {application.yearOfStudy} · Graduating {application.graduationYear} ·{" "}
        {application.reason}
      </p>
      {application.stages.map((stage) => (
        <div key={stage.id} className="rounded-field border border-border bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-semibold text-navy">{stage.office.name}</span>
            <div className="flex items-center gap-3">
              {stage.decidedBy && <span className="text-[12px] text-navy-soft">by {stage.decidedBy.fullName}</span>}
              <StatusBadge status={stage.status}>{STAGE_LABELS[stage.status]}</StatusBadge>
              <button
                type="button"
                onClick={() => setOpenStage(openStage === stage.id ? null : stage.id)}
                className="text-[12.5px] font-semibold text-teal hover:underline"
              >
                {openStage === stage.id ? "Hide" : "History"}
              </button>
            </div>
          </div>
          {openStage === stage.id && (
            <div className="mt-3 flex flex-col gap-3">
              <DocumentList documents={stage.documents} />
              <StageHistory events={stage.events} hideSystem={false} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Section 6.7 / 21.0 — monitor every clearance transaction
export default function ClearanceMonitoring() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/applications", {
        params: { status: status || undefined, q: query || undefined, limit: 200 },
      });
      setApplications(data.applications);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [status, query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Clearance monitoring"
        description="Every clearance request, where it currently sits, and its full history."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={[
                "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                status === f.key ? "border-teal bg-teal text-white" : "border-border bg-white text-navy-soft hover:text-navy",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input label="Search" placeholder="Student name or reg. no." value={query} onChange={(e) => setQuery(e.target.value)} className="w-[260px]" />
      </div>

      <Card className="overflow-hidden p-0">
        {error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : applications.length === 0 ? (
          <p className="px-6 py-5 text-[13.5px] text-navy-soft">No clearance requests found.</p>
        ) : (
          <>
            <p className="px-6 pt-4 text-[12.5px] text-navy-soft">{total} request{total === 1 ? "" : "s"}</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Started</th>
                  <th className="px-6 py-3 font-semibold">Currently with</th>
                  <th className="px-6 py-3 font-semibold">Stage status</th>
                  <th className="px-6 py-3 font-semibold">Clearance</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Fragment key={app.id}>
                    <tr className="border-b border-border">
                      <td className="px-6 py-3">
                        <p className="text-[14px] font-semibold text-navy">{app.student?.fullName}</p>
                        <p className="text-[12.5px] text-navy-soft">{app.student?.studentId}</p>
                      </td>
                      <td className="px-6 py-3 text-[13.5px] text-navy-soft">{formatDate(app.startedAt)}</td>
                      <td className="px-6 py-3 text-[13.5px] text-navy-soft">{app.currentOffice || "—"}</td>
                      <td className="px-6 py-3">
                        {app.currentStatus ? (
                          <StatusBadge status={app.currentStatus}>{STAGE_LABELS[app.currentStatus]}</StatusBadge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={app.status}>{APPLICATION_LABELS[app.status]}</StatusBadge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                          className="text-[13px] font-semibold text-teal hover:underline"
                        >
                          {expanded === app.id ? "Close" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {expanded === app.id && (
                      <tr className="border-b border-border bg-surface">
                        <td colSpan={6} className="px-6 py-4">
                          <ApplicationDetail id={app.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </AppShell>
  );
}
