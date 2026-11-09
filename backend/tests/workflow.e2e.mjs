// End-to-end test of the clearance workflow (section 20.0 "Transaction Testing").
// Run against a FRESH database (migrate, seed, import CSVs) with the server running:
//   npm run test:e2e
// It logs in many times — restart the server first if the login rate limit was hit.
// End-to-end test of the clearance workflow API
const BASE = process.env.API || "http://localhost:5000/api";
let failures = 0;
const check = (cond, label) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
};

async function call(method, path, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  if (form) body = form;
  const res = await fetch(BASE + path, { method, headers, body });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  return { status: res.status, data };
}

const pdf = () => new Blob([Buffer.from("%PDF-1.4\n%test\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")], { type: "application/pdf" });
const fakePdf = () => new Blob([Buffer.from("MZ this is an exe")], { type: "application/pdf" });

const studentLogin = async (id, pw) => (await call("POST", "/auth/login", { json: { studentId: id, password: pw } })).data.token;
const staffLogin = async (email, pw) => (await call("POST", "/auth/staff-login", { json: { email, password: pw } })).data;

function clearanceForm({ withSA = false, skip = [] } = {}) {
  const f = new FormData();
  f.append("email", "student@must.ac.ug");
  f.append("phone", "0700123456");
  f.append("yearOfStudy", "Final year");
  f.append("graduationYear", "2026");
  f.append("reason", "Final graduation clearance");
  f.append("notes", "Returned all books in July.");
  for (const slug of ["finance", "library", "department"]) if (!skip.includes(slug)) f.append(slug, pdf(), `${slug}.pdf`);
  if (withSA) f.append("studentAffairs", pdf(), "sa.pdf");
  return f;
}

const s1 = await studentLogin("2023/BSE/001/PS", "Student@001");
const s2 = await studentLogin("2023/BSE/002/PS", "Student@002");
check(Boolean(s1 && s2), "students log in");

const fin = await staffLogin("finance.officer@must.ac.ug", "Finance@2026");
const lib = await staffLogin("library.officer@must.ac.ug", "Library@2026");
const dep = await staffLogin("department.officer@must.ac.ug", "Department@2026");
const sa = await staffLogin("studentaffairs.officer@must.ac.ug", "StudentAffairs@2026");
const reg = await staffLogin("registrar@must.ac.ug", "Registrar@2026");
const adm = await staffLogin("admin@must.ac.ug", "Admin@2026");
check(fin.user.office?.slug === "finance", "officer login returns office");

// Auth / RBAC
check((await call("GET", "/clearance/me")).status === 401, "no token → 401");
check((await call("GET", "/officer/requests", { token: s1 })).status === 403, "student can't use officer API");
check((await call("GET", "/admin/users", { token: fin.token })).status === 403, "officer can't use admin API");

// Validation
let r = await call("POST", "/clearance", { token: s1, form: clearanceForm({ skip: ["library"] }) });
check(r.status === 400 && /Library/.test(r.data.message), "missing required office documents rejected");
const bad = clearanceForm(); bad.set("phone", "123");
r = await call("POST", "/clearance", { token: s1, form: bad });
check(r.status === 400 && r.data.details?.fields?.phone, "invalid phone rejected");
const spoof = clearanceForm(); spoof.set("finance", fakePdf(), "evil.pdf");
r = await call("POST", "/clearance", { token: s1, form: spoof });
check(r.status === 400 && /does not match/.test(r.data.message), "spoofed file type rejected");

// Submit
r = await call("POST", "/clearance", { token: s1, form: clearanceForm() });
check(r.status === 201, "student 1 submits clearance");
let app = r.data.application;
const st = (slug) => app.stages.find((s) => s.office.slug === slug);
check(st("finance").status === "pending" && st("library").status === "waiting", "finance pending, library waiting (sequential)");
check(st("studentAffairs").status === "not_required", "optional Student Affairs skipped without docs");
check(st("finance").documents.length === 1, "documents stored on stage");

r = await call("POST", "/clearance", { token: s1, form: clearanceForm() });
check(r.status === 409, "second active request blocked");

// Library can't see it yet
r = await call("GET", "/officer/requests", { token: lib.token });
check(r.data.requests.length === 0, "library queue empty while finance is pending");
r = await call("GET", `/officer/requests/${st("library").id}`, { token: lib.token });
check(r.status === 404, "library can't open a waiting stage");
r = await call("GET", `/officer/requests/${st("finance").id}`, { token: lib.token });
check(r.status === 404, "library can't open finance stage");

// Finance opens + approves
r = await call("GET", "/officer/requests?status=actionable", { token: fin.token });
check(r.data.requests.length === 1, "finance sees request in queue");
r = await call("GET", `/officer/requests/${st("finance").id}`, { token: fin.token });
check(r.data.request.status === "under_review", "opening marks under_review");
const docId = r.data.request.documents[0].id;
let dl = await fetch(`${BASE}/documents/${docId}`, { headers: { Authorization: `Bearer ${fin.token}` } });
check(dl.status === 200 && dl.headers.get("content-type") === "application/pdf", "finance can view document");
dl = await fetch(`${BASE}/documents/${docId}`, { headers: { Authorization: `Bearer ${s2}` } });
check(dl.status === 404, "other student can't view document");
dl = await fetch(`${BASE}/documents/${docId}`, { headers: { Authorization: `Bearer ${lib.token}` } });
check(dl.status === 404, "other office can't view document");

r = await call("POST", `/officer/requests/${st("finance").id}/decision`, { token: fin.token, json: { action: "reject" } });
check(r.status === 400, "reject without comment refused");
r = await call("POST", `/officer/requests/${st("finance").id}/decision`, { token: fin.token, json: { action: "approve" } });
check(r.status === 200, "finance approves");
r = await call("POST", `/officer/requests/${st("finance").id}/decision`, { token: fin.token, json: { action: "approve" } });
check(r.status === 409, "double decision refused");

// Library: correction → resubmit → approve
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
check(st("library").status === "pending", "library now pending");
r = await call("POST", `/officer/requests/${st("library").id}/decision`, { token: lib.token, json: { action: "correction", comment: "Clear book fine of UGX 15,000." } });
check(r.status === 200, "library requests correction");
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
check(st("library").status === "correction_required" && st("finance").status === "approved", "correction keeps finance approved");
let notes = (await call("GET", "/notifications", { token: s1 })).data;
check(notes.notifications.some((n) => n.type === "correction_required"), "student notified of correction");

const fix = new FormData(); fix.append("files", pdf(), "receipt.pdf"); fix.append("message", "Fine paid, receipt attached.");
r = await call("POST", `/clearance/stages/${st("department").id}/resubmit`, { token: s1, form: fix });
check(r.status === 409, "can't resubmit a stage that isn't asking");
const fix2 = new FormData(); fix2.append("files", pdf(), "receipt.pdf"); fix2.append("message", "Fine paid, receipt attached.");
r = await call("POST", `/clearance/stages/${st("library").id}/resubmit`, { token: s1, form: fix2 });
check(r.status === 200, "student resubmits to library");
app = r.data.application;
check(st("library").status === "resubmitted" && st("library").documents.length === 2, "stage resubmitted with new doc");
r = await call("GET", "/officer/requests?status=actionable", { token: lib.token });
check(r.data.requests[0]?.status === "resubmitted", "library queue shows resubmitted");
r = await call("POST", `/officer/requests/${st("library").id}/decision`, { token: lib.token, json: { action: "approve" } });
check(r.status === 200, "library approves after resubmission");

// Department: reject → application rejected → resubmit reopens
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
r = await call("POST", `/officer/requests/${st("department").id}/decision`, { token: dep.token, json: { action: "reject", comment: "Dissertation not submitted." } });
check(r.status === 200, "department rejects");
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
check(app.status === "rejected", "application rejected");
const fix3 = new FormData(); fix3.append("message", "no file");
r = await call("POST", `/clearance/stages/${st("department").id}/resubmit`, { token: s1, form: fix3 });
check(r.status === 400, "rejected stage needs a document");
const fix4 = new FormData(); fix4.append("files", pdf(), "dissertation.pdf");
r = await call("POST", `/clearance/stages/${st("department").id}/resubmit`, { token: s1, form: fix4 });
check(r.status === 200 && r.data.application.status === "in_progress", "resubmission reopens the transaction");
await call("POST", `/officer/requests/${st("department").id}/decision`, { token: dep.token, json: { action: "approve", comment: "OK" } });

// Student Affairs skipped → registrar next
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
check(st("registrar").status === "pending", "registrar pending after SA skipped");
r = await call("GET", "/officer/requests?status=actionable", { token: sa.token });
check(r.data.requests.length === 0, "student affairs queue empty");
r = await call("POST", `/officer/requests/${st("registrar").id}/decision`, { token: reg.token, json: { action: "approve" } });
check(r.status === 200, "registrar finalizes");
app = (await call("GET", "/clearance/me", { token: s1 })).data.application;
check(app.status === "completed" && app.completedAt, "CLEARANCE COMPLETED");
notes = (await call("GET", "/notifications", { token: s1 })).data;
check(notes.notifications.some((n) => n.type === "clearance_completed"), "student notified of completion");
check(app.stages.find((s) => s.office.slug === "library").events.length >= 5, "stage history kept");
r = await call("POST", "/clearance", { token: s1, form: clearanceForm() });
check(r.status === 409, "completed student can't submit again");

// Student 2 with Student Affairs docs
r = await call("POST", "/clearance", { token: s2, form: clearanceForm({ withSA: true }) });
check(r.status === 201 && r.data.application.stages.find((s) => s.office.slug === "studentAffairs").status === "waiting", "SA stage included when docs given");

// Officer dashboard + history
r = await call("GET", "/officer/dashboard", { token: fin.token });
check(r.status === 200 && r.data.stats.pending === 1 && r.data.stats.approvedThisSemester === 1, "finance dashboard stats");
r = await call("GET", "/officer/history", { token: lib.token });
check(r.data.history.length === 2, "library history has 2 decisions");

// Admin
r = await call("GET", "/admin/overview", { token: adm.token });
check(r.status === 200 && r.data.applications.completed === 1 && r.data.offices.length === 5, "admin overview");
r = await call("GET", "/admin/applications?q=Student%20One", { token: adm.token });
check(r.data.total === 1, "admin search applications");
r = await call("GET", `/admin/applications/${app.id}`, { token: adm.token });
check(r.status === 200 && r.data.application.student.studentId === "2023/BSE/001/PS", "admin application detail");
r = await call("POST", "/admin/users", { token: adm.token, json: { role: "officer", fullName: "Second Finance", email: "fin2@must.ac.ug", password: "Finance2026", officeId: fin.user.office.id } });
check(r.status === 201 && r.data.user.office.slug === "finance", "admin creates officer");
const newId = r.data.user.id;
r = await call("POST", "/admin/users", { token: adm.token, json: { role: "officer", fullName: "X", email: "x@must.ac.ug", password: "short" } });
check(r.status === 400, "weak password / missing office refused");
r = await call("PATCH", `/admin/users/${newId}`, { token: adm.token, json: { isActive: false } });
check(r.status === 200 && r.data.user.isActive === false, "admin deactivates user");
r = await call("POST", "/auth/staff-login", { json: { email: "fin2@must.ac.ug", password: "Finance2026" } });
check(r.status === 403, "deactivated user can't log in");
r = await call("PATCH", `/admin/users/${adm.user.id}`, { token: adm.token, json: { isActive: false } });
check(r.status === 400, "admin can't deactivate self");
r = await call("GET", "/admin/audit-logs?action=stage.", { token: adm.token });
check(r.data.total >= 6, `audit trail has stage decisions (${r.data.total})`);
r = await call("GET", "/admin/reports/applications.csv", { token: adm.token });
check(r.status === 200 && r.data.includes("2023/BSE/001/PS"), "CSV report export");
r = await call("GET", "/admin/offices", { token: adm.token });
check(r.data.offices.find((o) => o.slug === "finance").officerCount === 1, "offices with officer counts");

// Department scoping
r = await call("POST", "/admin/users", { token: adm.token, json: { role: "student", fullName: "Civil Student", studentId: "2023/BCE/001/PS", department: "Civil Engineering", password: "Civil2026x" } });
check(r.status === 201, "admin creates student in another department");
const cs = await studentLogin("2023/BCE/001/PS", "Civil2026x");
await call("POST", "/clearance", { token: cs, form: clearanceForm() });
let csApp = (await call("GET", "/clearance/me", { token: cs })).data.application;
for (const [slug, officer] of [["finance", fin], ["library", lib]]) {
  const id = csApp.stages.find((s) => s.office.slug === slug).id;
  await call("POST", `/officer/requests/${id}/decision`, { token: officer.token, json: { action: "approve" } });
}
csApp = (await call("GET", "/clearance/me", { token: cs })).data.application;
const csDept = csApp.stages.find((s) => s.office.slug === "department");
r = await call("GET", "/officer/requests?status=actionable", { token: dep.token });
check(!r.data.requests.some((q) => q.stageId === csDept.id), "SE department officer doesn't see Civil student");
r = await call("POST", `/officer/requests/${csDept.id}/decision`, { token: dep.token, json: { action: "approve" } });
check(r.status === 403, "SE department officer can't decide Civil student");

r = await call("GET", "/auth/me", { token: dep.token });
check(r.data.user.office.slug === "department", "/auth/me");

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
