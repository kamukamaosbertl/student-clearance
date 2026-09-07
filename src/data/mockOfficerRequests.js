// TODO: replace everything in this file with real API calls once the
// backend is wired up. Every officer screen that needs request data
// reads from here for now, so there's exactly one place to swap out.

export const officeName = "Library";

export const pendingRequests = [
  {
    id: "2023-bse-058-ps",
    student: "Kamukama Osbert",
    regNo: "2023/BSE/058/PS",
    programme: "BSc. Software Engineering",
    submitted: "24 Aug 2026",
    status: "in-review",
    statusLabel: "In review",
    documents: [
      { name: "fees_statement.pdf", size: "412 KB" },
      { name: "library_card.jpg", size: "180 KB" },
    ],
    note: "I returned all books in July — receipt attached from the front desk.",
  },
  {
    id: "2023-bse-006-ps",
    student: "Ahebwa Faith",
    regNo: "2023/BSE/006/PS",
    programme: "BSc. Software Engineering",
    submitted: "23 Aug 2026",
    status: "not-started",
    statusLabel: "Not started",
    documents: [],
    note: "",
  },
  {
    id: "2023-bse-026-ps",
    student: "Arinda Nicholas",
    regNo: "2023/BSE/026/PS",
    programme: "BSc. Software Engineering",
    submitted: "21 Aug 2026",
    status: "approved",
    statusLabel: "Approved",
    documents: [],
    note: "",
  },
  {
    id: "2023-bse-136-ps",
    student: "Owomaani Mwesigwa",
    regNo: "2023/BSE/136/PS",
    programme: "BSc. Software Engineering",
    submitted: "20 Aug 2026",
    status: "correction-sent",
    statusLabel: "Correction sent",
    documents: [],
    note: "",
  },
];

export const processingHistory = [
  { student: "Arinda Nicholas", decision: "approved", decisionLabel: "Approved", date: "21 Aug 2026, 10:14 AM" },
  { student: "Owomaani Mwesigwa", decision: "correction-required", decisionLabel: "Correction requested", date: "20 Aug 2026, 2:40 PM" },
  { student: "Nimusima Alvin", decision: "approved", decisionLabel: "Approved", date: "19 Aug 2026, 9:05 AM" },
  { student: "Ainebyoona Micheal", decision: "rejected", decisionLabel: "Rejected", date: "18 Aug 2026, 11:52 AM" },
];