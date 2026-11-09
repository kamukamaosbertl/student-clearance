import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import StatusBadge from "../../components/ui/Statusbadge";
import api, { apiErrorMessage } from "../../api/client";
import { ROLE_LABELS, formatDateTime } from "../../utils/status";

const EMPTY_FORM = {
  role: "officer",
  fullName: "",
  email: "",
  studentId: "",
  programme: "",
  faculty: "",
  department: "",
  officeId: "",
  password: "",
  isActive: true,
};

const ROLE_FILTERS = [
  { key: "", label: "All" },
  { key: "student", label: "Students" },
  { key: "officer", label: "Officers" },
  { key: "admin", label: "Administrators" },
];

// Section 6.7 — manage user accounts and assign roles/offices
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [offices, setOffices] = useState([]);
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null = closed, "new" or a user object
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users", { params: { role: role || undefined, q: query || undefined, limit: 200 } });
      setUsers(data.users);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [role, query]);

  useEffect(() => {
    const timer = setTimeout(load, 250); // small debounce while typing in search
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api.get("/admin/offices").then(({ data }) => setOffices(data.offices)).catch(() => {});
  }, []);

  function openNew() {
    setEditing("new");
    setForm(EMPTY_FORM);
    setFormError("");
    setFormMessage("");
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      role: user.role,
      fullName: user.fullName || "",
      email: user.email || "",
      studentId: user.studentId || "",
      programme: user.programme || "",
      faculty: user.faculty || "",
      department: user.department || "",
      officeId: user.officeId ? String(user.officeId) : "",
      password: "",
      isActive: user.isActive,
    });
    setFormError("");
    setFormMessage("");
  }

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setFormMessage("");
    setIsSaving(true);

    const payload = {
      role: form.role,
      fullName: form.fullName,
      email: form.email,
      studentId: form.studentId,
      programme: form.programme,
      faculty: form.faculty,
      department: form.department,
      officeId: form.role === "officer" ? form.officeId || null : null,
      isActive: form.isActive,
    };

    try {
      if (editing === "new") {
        await api.post("/admin/users", { ...payload, password: form.password });
        setEditing(null);
      } else {
        await api.patch(`/admin/users/${editing.id}`, payload);
        if (form.password) {
          await api.post(`/admin/users/${editing.id}/reset-password`, { password: form.password });
        }
        setFormMessage("Changes saved.");
        setForm((prev) => ({ ...prev, password: "" }));
      }
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, "The user could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administrator"
        title="User management"
        description="Create accounts, assign officers to offices and deactivate users who should no longer have access."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRole(f.key)}
              className={[
                "rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                role === f.key ? "border-teal bg-teal text-white" : "border-border bg-white text-navy-soft hover:text-navy",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <Input label="Search" placeholder="Name, email or reg. no." value={query} onChange={(e) => setQuery(e.target.value)} className="w-[260px]" />
          <Button onClick={openNew}>Add user</Button>
        </div>
      </div>

      {editing && (
        <Card>
          <h3 className="text-[15px] font-semibold text-navy">
            {editing === "new" ? "New user" : `Edit ${editing.fullName}`}
          </h3>
          <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Select label="Role" required value={form.role} onChange={set("role")}>
                <option value="student">Student</option>
                <option value="officer">Officer</option>
                <option value="admin">Administrator</option>
              </Select>
              <Input label="Full name" required value={form.fullName} onChange={set("fullName")} />
              {form.role === "student" ? (
                <Input label="Registration number" required placeholder="2023/BSE/058/PS" value={form.studentId} onChange={set("studentId")} />
              ) : (
                <Input label="Email" required type="email" value={form.email} onChange={set("email")} />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {form.role === "officer" && (
                <Select label="Office" required value={form.officeId} onChange={set("officeId")}>
                  <option value="">Select office</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Select>
              )}
              {form.role === "student" && (
                <>
                  <Input label="Programme" value={form.programme} onChange={set("programme")} />
                  <Input label="Faculty" value={form.faculty} onChange={set("faculty")} />
                </>
              )}
              {form.role !== "admin" && (
                <Input
                  label="Department"
                  hint={form.role === "officer" ? "For Department officers: only students of this department are shown" : undefined}
                  value={form.department}
                  onChange={set("department")}
                />
              )}
              {form.role === "student" && <Input label="Email (optional)" type="email" value={form.email} onChange={set("email")} />}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label={editing === "new" ? "Password" : "New password"}
                required={editing === "new"}
                type="password"
                autoComplete="new-password"
                hint={editing === "new" ? "At least 8 characters with letters and numbers" : "Leave empty to keep the current password"}
                value={form.password}
                onChange={set("password")}
              />
              <label className="flex items-center gap-2 self-center text-[13.5px] text-navy">
                <input type="checkbox" checked={form.isActive} onChange={set("isActive")} className="size-4 accent-teal" />
                Account active
              </label>
            </div>

            {formError && <p className="text-[13px] text-danger">{formError}</p>}
            {formMessage && <p className="text-[13px] font-medium text-teal-dark">{formMessage}</p>}

            <div className="flex gap-2.5">
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save"}</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Close</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        {error ? (
          <p className="px-6 py-5 text-[13.5px] text-danger">{error}</p>
        ) : (
          <>
            <p className="px-6 pt-4 text-[12.5px] text-navy-soft">{total} user{total === 1 ? "" : "s"}</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11.5px] font-semibold uppercase tracking-wide text-navy-soft">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Login</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Office / department</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Last login</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-[14px] font-medium text-navy">{u.fullName}</td>
                    <td className="px-6 py-3 text-[13.5px] text-navy-soft">{u.role === "student" ? u.studentId : u.email}</td>
                    <td className="px-6 py-3 text-[13.5px] text-navy-soft">{ROLE_LABELS[u.role]}</td>
                    <td className="px-6 py-3 text-[13.5px] text-navy-soft">{u.office?.name || u.department || "—"}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={u.isActive ? "active" : "inactive"}>{u.isActive ? "Active" : "Inactive"}</StatusBadge>
                    </td>
                    <td className="px-6 py-3 text-[13px] text-navy-soft">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                    <td className="px-6 py-3 text-right">
                      <button type="button" onClick={() => openEdit(u)} className="text-[13px] font-semibold text-teal hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </AppShell>
  );
}
