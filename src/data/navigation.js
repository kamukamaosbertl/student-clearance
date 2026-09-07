// "Student screens" list. `path` values match the router below.
export const studentNavItems = [
  { key: "login", label: "Log in", path: "/login" },
  { key: "clearance-request", label: "Clearance request", path: "/clearance/personal" },
  { key: "clearance-progress", label: "Clearance progress", path: "/clearance/progress" },
  { key: "correction-feedback", label: "Correction / feedback", path: "/clearance/feedback" },
];

// The 5-step wizard shown inside "Clearance request".
export const wizardSteps = [
  { key: "personal", label: "Personal", path: "/clearance/personal" },
  { key: "academic", label: "Academic", path: "/clearance/academic" },
  { key: "details", label: "Clearance details", path: "/clearance/details" },
  { key: "documents", label: "Documents", path: "/clearance/documents" },
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
