import { createContext, useContext, useState } from "react";

const ClearanceFormContext = createContext(null);

const initialState = {
  personal: { email: "", phone: "" },
  academic: { yearOfStudy: "", graduationYear: "" },
  details: { reason: "", notes: "" },
  documents: { files: [] },
};

export function ClearanceFormProvider({ children }) {
  const [formData, setFormData] = useState(initialState);

  // Shallow-merges a patch into one section, e.g. updateSection("personal", { email: "x" })
  const updateSection = (section, patch) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  };

  const resetForm = () => setFormData(initialState);

  return (
    <ClearanceFormContext.Provider value={{ formData, updateSection, resetForm }}>
      {children}
    </ClearanceFormContext.Provider>
  );
}

export function useClearanceForm() {
  const ctx = useContext(ClearanceFormContext);
  if (!ctx) throw new Error("useClearanceForm must be used inside ClearanceFormProvider");
  return ctx;
}
