# MUST Clearance — Backend

Node.js + Express + Sequelize + PostgreSQL server for the Workflow-Driven Student Clearance Management System.

## Setup

```bash
npm install
cp .env.example .env        # then fill in your database password and a JWT secret
```

**New database** (empty `must_clearance`):

```bash
npm run setup               # migrations + office seed + staff and student CSV import
npm run dev
```

**Existing database** (you already ran the earlier migrations, seed and imports):

```bash
npm run db:migrate          # applies only the new migrations; existing users and offices are kept
npm run dev
```

The new migrations link existing officers to their office automatically (by matching `department` to the office name; academic departments such as "Software Engineering" go to the Department office).

Uploaded documents are saved in `backend/uploads/` (set `UPLOAD_DIR` to change it). That folder and `.env` are in `.gitignore`.

## How the workflow works

A clearance request is a long-duration transaction (plan §9). Offices handle it **one at a time, in order**:

```
Finance → Library → Department → Student Affairs → Academic Registrar → COMPLETED
```

- Stage states (§10): `waiting`, `pending`, `under_review`, `approved`, `rejected`, `correction_required`, `resubmitted`, `not_required`.
- Student Affairs is optional. If the student uploads nothing for it, the stage is `not_required` and the workflow skips it.
- **Correction:** the stage waits for the student, who resubmits. Only that office reviews again; offices that already approved stay approved (§15).
- **Rejection:** the whole request becomes `rejected` until the student resubmits that stage with a new document. Then it is `in_progress` again.
- The Registrar stage opens only after every other stage is approved or not required. The Registrar's approval completes the clearance.
- Every change runs in a database transaction that locks the request, so two people can't change the same request at the same moment.
- Department officers who have a `department` set only see students from that department.

## API

All routes are under `/api`. Every route except login needs `Authorization: Bearer <token>`.

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | `/auth/login` | — | Student login `{ studentId, password }` |
| POST | `/auth/staff-login` | — | Officer/admin login `{ email, password }` |
| GET | `/auth/me` | any | Current user (incl. officer's office) |
| POST | `/auth/change-password` | any | `{ currentPassword, newPassword }` |
| GET | `/offices` | any | Offices in workflow order |
| GET | `/clearance/me` | student | Current request with stages, documents and history |
| POST | `/clearance` | student | Submit request — multipart: `email, phone, yearOfStudy, graduationYear, reason, notes` + files in fields `finance`, `library`, `department`, `studentAffairs` |
| POST | `/clearance/stages/:stageId/resubmit` | student | Answer a correction or rejection — multipart: `message` + files |
| GET | `/officer/dashboard` | officer | Queue stats and overdue requests |
| GET | `/officer/requests?status=` | officer | Work queue (`actionable`, `all`, `approved`, `rejected`, `correction_required`, …) |
| GET | `/officer/requests/:stageId` | officer | Request details (marks it `under_review`) |
| POST | `/officer/requests/:stageId/decision` | officer | `{ action: "approve" \| "reject" \| "correction", comment }` (comment required unless approving) |
| GET | `/officer/history` | officer | Decisions made by this officer |
| GET | `/notifications` | student, officer | Notifications + unread count |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | student, officer | Mark as read |
| GET | `/documents/:id` | owner, office, admin | View an uploaded document (permission-checked) |
| GET | `/admin/overview` | admin | Totals, per-office workload, recent activity |
| GET | `/admin/applications?status=&q=` | admin | Clearance monitoring |
| GET | `/admin/applications/:id` | admin | Full request with history |
| GET/POST | `/admin/users` | admin | List / create users |
| PATCH | `/admin/users/:id` | admin | Edit role, office, active flag, details |
| POST | `/admin/users/:id/reset-password` | admin | `{ password }` |
| GET | `/admin/offices`, PATCH `/admin/offices/:id` | admin | Office configuration (`isActive`, `isRequired`) |
| GET | `/admin/audit-logs?action=` | admin | Audit trail |
| GET | `/admin/reports/applications.csv` | admin | CSV report of all requests |

Errors always come back as `{ message }` (plus `details` for validation errors).

## Security measures (§16)

- JWT authentication. The user is re-loaded on every request, so a deactivated account loses access immediately.
- Role-based access control on every route. Officers can only open and decide stages of their own office.
- Uploads: PDF/JPG/PNG only, 5 MB each. The file content is checked against its type (magic bytes). Files get random names and are served only through the permission-checked route. Files from failed requests are deleted.
- Login rate limit (10 per 15 minutes) and a general API rate limit.
- Server-side validation of every field. Generic error messages for server errors.
- Audit log of logins, failed logins, submissions, decisions, document views, user and office changes, and report exports.

## Tests

`tests/workflow.e2e.mjs` covers the transaction tests in §20: successful clearance, rejected stage, correction, resubmission, approvals by several offices, permission checks, admin functions and department scoping. Run it against a **fresh** database with the server running:

```bash
npm run test:e2e
```
