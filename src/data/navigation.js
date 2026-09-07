// "Log in" was removed from this list — it's not in-app navigation, it's
// the doorway INTO the app. By the time a student can see this sidebar,
// they've already logged in, so a link back to the login screen doesn't
// belong here. Dashboard replaces it as the first/home item.
export const studentNavItems = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard" },
  { key: "clearance-request", label: "Clearance request", path: "/clearance/personal" },
  { key: "clearance-progress", label: "Clearance progress", path: "/clearance/progress" },
  { key: "correction-feedback", label: "Correction / feedback", path: "/clearance/feedback" },
];

// Step 1 is the student's own info (personal + academic + reason for
// clearance, all in one screen). Every step after that is one office —
// matches the real clearance process: fill your info once, then give
// each office exactly what THEY need, one at a time, HESFB-style.
export const wizardSteps = [
  { key: "personal", label: "Personal", path: "/clearance/personal" },
  { key: "finance", label: "Finance", path: "/clearance/office/finance" },
  { key: "library", label: "Library", path: "/clearance/office/library" },
  { key: "department", label: "Department", path: "/clearance/office/department" },
  { key: "studentAffairs", label: "Student Affairs", path: "/clearance/office/studentAffairs" },
  { key: "review", label: "Review", path: "/clearance/review" },
];

 
// "Officer screens" list — shown when Sidebar is rendered on an
// officer route. `path` values match whatever routes you register in
// App.jsx as you build these screens out.
export const officerNavItems = [
  { key: "dashboard", label: "Dashboard", path: "/officer/dashboard" },
  { key: "queue", label: "Pending requests", path: "/officer/queue" },
  { key: "request-review", label: "Request review", path: "/officer/request" },
  { key: "processing-history", label: "Processing history", path: "/officer/history" },
];
  
// "Admin screens" list — same idea, for admin routes.
export const adminNavItems = [
  { key: "login", label: "Log in", path: "/admin/login" },
  { key: "user-management", label: "User management", path: "/admin/users" },
  { key: "monitoring", label: "Clearance monitoring", path: "/admin/monitoring" },
  { key: "reports", label: "Reports", path: "/admin/reports" },
  { key: "audit-logs", label: "System activity / audit logs", path: "/admin/audit" },
];
