import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";
import { useLiveEvent } from "./LiveEventsContext";

const ClearanceFormContext = createContext(null);

const initialFormData = {
  personal: { email: "", phone: "" },
  academic: { yearOfStudy: "", graduationYear: "" },
  details: { reason: "", notes: "" },
  documents: { finance: [], library: [], department: [], studentAffairs: [] },
};

// Holds two things for the logged-in student:
//  1. formData    — what they are typing in the wizard (kept in memory,
//                   including the File objects, until they submit)
//  2. application — their real clearance request as stored on the server
//                   (GET /api/clearance/me), with every office's stage
export function ClearanceFormProvider({ children }) {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [formData, setFormData] = useState(initialFormData);
  const [application, setApplication] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [wizardStarted, setWizardStarted] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/clearance/me");
      setApplication(data.application);
      setLoadError("");
      return data.application;
    } catch (error) {
      setLoadError(error.response?.data?.message || "Could not load your clearance request.");
      return null;
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // Load the student's request after login; clear everything on logout so
  // one student's data never shows up for the next person on the computer
  useEffect(() => {
    if (isStudent) {
      setHasLoaded(false);
      refresh();
    } else {
      setApplication(null);
      setFormData(initialFormData);
      setWizardStarted(false);
      setHasLoaded(false);
    }
  }, [isStudent, user?.id, refresh]);

  // The server pushes "clearance.changed" when an office decides a stage —
  // the progress page updates by itself, no reload needed
  const refreshIfStudent = useCallback(() => {
    if (isStudent) refresh();
  }, [isStudent, refresh]);
  useLiveEvent("clearance.changed", refreshIfStudent);

  const updateSection = useCallback((section, patch) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }, []);

  // Marks the wizard as started so the Sidebar unlocks the other screens
  const startClearance = useCallback(() => setWizardStarted(true), []);

  const resetForm = useCallback(() => setFormData(initialFormData), []);

  // Sends the whole wizard to POST /api/clearance as multipart/form-data.
  // Throws on failure so ReviewStep can keep the student's data on screen.
  const submitClearance = useCallback(async () => {
    const body = new FormData();
    body.append("email", formData.personal.email.trim());
    body.append("phone", formData.personal.phone.trim());
    body.append("yearOfStudy", formData.academic.yearOfStudy);
    body.append("graduationYear", formData.academic.graduationYear);
    body.append("reason", formData.details.reason);
    body.append("notes", formData.details.notes);

    // One file field per office, named after the office key (finance, library, ...)
    Object.entries(formData.documents).forEach(([officeKey, files]) => {
      files.forEach((file) => body.append(officeKey, file));
    });

    const { data } = await api.post("/clearance", body);
    setApplication(data.application);
    setFormData(initialFormData);
    return data.application;
  }, [formData]);

  // Responds to a correction request / rejection for one stage
  const resubmitStage = useCallback(async (stageId, files, message) => {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    if (message.trim()) body.append("message", message.trim());

    const { data } = await api.post(`/clearance/stages/${stageId}/resubmit`, body);
    setApplication(data.application);
    return data.application;
  }, []);

  // Stages keyed by office key, e.g. stages.finance.status
  const stages = useMemo(
    () => Object.fromEntries((application?.stages || []).map((s) => [s.office.slug, s])),
    [application]
  );

  const value = {
    formData,
    updateSection,
    resetForm,
    application,
    stages,
    hasLoaded,
    loadError,
    refresh,
    submitClearance,
    resubmitStage,
    hasStarted: wizardStarted || Boolean(application),
    startClearance,
  };

  return <ClearanceFormContext.Provider value={value}>{children}</ClearanceFormContext.Provider>;
}

export function useClearanceForm() {
  const ctx = useContext(ClearanceFormContext);
  if (!ctx) throw new Error("useClearanceForm must be used inside ClearanceFormProvider");
  return ctx;
}
