// One shared list of offices, used by PersonalInfoStep, OfficeDocumentsStep,
// ReviewStep, ClearanceProgress, and CorrectionFeedback — one place to add
// or remove an office instead of duplicating the list across files.
//
// `required: false` on studentAffairs means it never blocks submission.
// registrar has no documents of its own — per the project plan, Registrar
// finalizes after every other office approves, it doesn't collect
// documents from the student directly.
export const OFFICES = [
  { key: "finance", label: "Finance", required: true, hint: "Typical requirement: payment receipt or bank slip for tuition and graduation/gown fees." },
  { key: "library", label: "Library", required: true, hint: "Typical requirement: proof of returned books, or a cleared-fines confirmation." },
  { key: "department", label: "Department / Faculty", required: true, hint: "Typical requirement: final year project/dissertation submission proof." },
  { key: "studentAffairs", label: "Student Affairs", required: false, hint: "If applicable: hostel key handover slip or exit form." },
  { key: "registrar", label: "Academic Registrar", required: false, isFinalizer: true },
];

export const DOCUMENT_OFFICES = OFFICES.filter((o) => !o.isFinalizer);