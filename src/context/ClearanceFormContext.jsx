import { createContext, useContext, useState } from "react";
import { OFFICES } from "../data/offices";

const ClearanceFormContext = createContext(null);

const initialFormData = {
  personal: { email: "", phone: "" },
  academic: { yearOfStudy: "", graduationYear: "" },
  details: { reason: "", notes: "" },
  documents: { finance: [], library: [], department: [], studentAffairs: [] },
};

const initialStages = Object.fromEntries(
  OFFICES.map((o) => [o.key, { status: "not_started", note: "" }])
);

export function ClearanceFormProvider({ children }) {
  const [formData, setFormData] = useState(initialFormData);
  const [stages, setStages] = useState(initialStages);

  // NEW: tracks whether the student has ever reached the wizard, so the
  // Sidebar can lock Clearance request / Progress / Correction until
  // this is true — gates BOTH the button click AND someone typing the
  // wizard URL directly (see PersonalInfoStep, which sets this on mount).
  const [hasStarted, setHasStarted] = useState(false);

  const updateSection = (section, patch) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  };

  const startClearance = () => setHasStarted(true);

  const submitClearance = () => {
    setStages((prev) => {
      const next = { ...prev };
      OFFICES.forEach((o) => {
        if (!o.isFinalizer) next[o.key] = { status: "pending", note: "" };
      });
      return next;
    });
  };

  const resubmitStage = (officeKey) => {
    setStages((prev) => ({ ...prev, [officeKey]: { status: "pending", note: "" } }));
  };

  const setStageStatus = (officeKey, status, note = "") => {
    setStages((prev) => ({ ...prev, [officeKey]: { status, note } }));
  };

  // FIXED: this used to also reset `stages`, which meant calling this
  // right after submitClearance() (in ReviewStep) instantly wiped the
  // "pending" statuses it had just set — Dashboard/Progress would show
  // "not submitted" forever, even after a real submission. Now this only
  // clears what the student TYPED, not the workflow state offices see.
  const resetForm = () => setFormData(initialFormData);

  return (
    <ClearanceFormContext.Provider
      value={{
        formData, updateSection,
        stages, submitClearance, resubmitStage, setStageStatus,
        hasStarted, startClearance,
        resetForm,
      }}
    >
      {children}
    </ClearanceFormContext.Provider>
  );
}

export function useClearanceForm() {
  const ctx = useContext(ClearanceFormContext);
  if (!ctx) throw new Error("useClearanceForm must be used inside ClearanceFormProvider");
  return ctx;
}