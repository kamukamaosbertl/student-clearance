import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";

// Section 6.7 "Manage system configuration" — which offices take part in
// clearance and whether students must submit documents to them.
export default function Offices() {
  const [offices, setOffices] = useState([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = () =>
    api
      .get("/admin/offices")
      .then(({ data }) => setOffices(data.offices))
      .catch((err) => setError(apiErrorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  async function toggle(office, field) {
    setSavingId(office.id);
    setError("");
    try {
      await api.patch(`/admin/offices/${office.id}`, { [field]: !office[field] });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="Offices & workflow"
        description="Offices process clearance in the order below. Changes apply to new clearance requests; requests already in progress keep their stages."
      />

      {error && <Card><p className="text-[13.5px] text-danger">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
              <th className="px-6 py-3 font-semibold">Order</th>
              <th className="px-6 py-3 font-semibold">Office</th>
              <th className="px-6 py-3 font-semibold">Officers</th>
              <th className="px-6 py-3 font-semibold">Documents</th>
              <th className="px-6 py-3 font-semibold">In workflow</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((office) => (
              <tr key={office.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3 text-[14px] text-navy-soft">{office.sequence}</td>
                <td className="px-6 py-3">
                  <p className="text-[14px] font-semibold text-navy">{office.name}</p>
                  <p className="text-[12.5px] text-navy-soft">{office.description}</p>
                </td>
                <td className="px-6 py-3 text-[14px] text-navy-soft">
                  {office.officerCount === 0 ? <StatusBadge status="overdue">None assigned</StatusBadge> : office.officerCount}
                </td>
                <td className="px-6 py-3">
                  {office.requiresDocuments ? (
                    <label className="flex items-center gap-2 text-[13.5px] text-navy">
                      <input
                        type="checkbox"
                        className="size-4 accent-teal"
                        checked={office.isRequired}
                        disabled={savingId === office.id}
                        onChange={() => toggle(office, "isRequired")}
                      />
                      Required
                    </label>
                  ) : (
                    <span className="text-[13px] text-navy-soft">Finalizes clearance</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <label className="flex items-center gap-2 text-[13.5px] text-navy">
                    <input
                      type="checkbox"
                      className="size-4 accent-teal"
                      checked={office.isActive}
                      disabled={savingId === office.id || office.slug === "registrar"}
                      onChange={() => toggle(office, "isActive")}
                    />
                    Active
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
