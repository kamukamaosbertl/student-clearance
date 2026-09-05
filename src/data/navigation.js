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