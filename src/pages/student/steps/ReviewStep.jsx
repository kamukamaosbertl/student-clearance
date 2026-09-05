import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { currentUser } from "../../../data/currentUser";
import { validateEmail, validatePhone, validateRequiredSelect, validateAtLeastOneFile } from "../../../utils/validators";

// NOTE: the "06 — Review & Submit" frame in the Figma file is empty (no
// layout was designed for it yet). This page is built to match the same
// card/stepper/input system as the other four steps so the flow is complete
// end-to-end — swap it out once that frame gets designed.
function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-border py-2 text-[13.5px] last:border-none">
      <span className="text-body">{label}</span>
      <span className="font-medium text-navy">{value || "—"}</span>
    </div>
  );
}

export default function ReviewStep() {
  const navigate = useNavigate();
  const { formData, resetForm } = useClearanceForm();
  const { personal, academic, details, documents } = formData;

  // ── VALIDATION STATE ────────────────────────────────────────────────
  // This page has no inputs of its own, so there's nothing to validate as
  // the user types. What it DOES validate is the *whole form* one last
  // time before submitting — this is a safety net in case someone lands
  // here by typing the URL directly (React Router doesn't stop that) and
  // skipped a required field on an earlier step.
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // ── VALIDATION: re-run every earlier step's required-field rules ────
    // If any of them fail, send the student back to that exact step
    // instead of showing a generic "something's wrong" message here.
    if (validateEmail(personal.email) || validatePhone(personal.phone)) {
      setSubmitError("Your personal information is incomplete.");
      navigate("/clearance/personal");
      return;
    }
    if (
      validateRequiredSelect(academic.yearOfStudy, "Year of study") ||
      validateRequiredSelect(academic.graduationYear, "Graduation year")
    ) {
      setSubmitError("Your academic information is incomplete.");
      navigate("/clearance/academic");
      return;
    }
    if (validateRequiredSelect(details.reason, "Reason for clearance")) {
      setSubmitError("Your clearance details are incomplete.");
      navigate("/clearance/details");
      return;
    }
    if (validateAtLeastOneFile(documents.files)) {
      setSubmitError("You need to attach at least one document.");
      navigate("/clearance/documents");
      return;
    }

    setSubmitError("");
    // TODO: POST to the clearance-requests endpoint (section 7.2/7.3 of the
    // project plan). If the server rejects it (e.g. a 422 with field
    // errors), set setSubmitError(serverMessage) here and DON'T resetForm/
    // navigate — keep the student's data on screen so they don't lose it.
    resetForm();
    navigate("/clearance/progress");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard stepKey="review" title="Review & submit" description="Check everything below before sending it to the offices.">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
          <div className="flex flex-col">
            <SummaryRow label="Student ID" value={currentUser.studentId} />
            <SummaryRow label="Full name" value={currentUser.fullName} />
            <SummaryRow label="Email address" value={personal.email} />
            <SummaryRow label="Phone number" value={personal.phone} />
            <SummaryRow label="Faculty" value={currentUser.faculty} />
            <SummaryRow label="Year of study" value={academic.yearOfStudy} />
            <SummaryRow label="Expected graduation year" value={academic.graduationYear} />
            <SummaryRow label="Reason for clearance" value={details.reason} />
            <SummaryRow label="Additional information" value={details.notes} />
            <SummaryRow label="Documents attached" value={documents.files.map((f) => f.name).join(", ")} />
          </div>

          {/* VALIDATION DISPLAY: only appears if the final pre-submit check above
              caught something and redirected the student to fix it */}
          {submitError && <p className="text-[13px] text-danger">{submitError}</p>}

          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" onClick={() => navigate("/clearance/documents")}>
              Back
            </Button>
            <Button type="submit">Submit clearance request</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}
