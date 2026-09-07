import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { currentUser } from "../../../data/currentUser";
import { DOCUMENT_OFFICES } from "../../../data/offices";
import { validateEmail, validatePhone, validateRequiredSelect, validateAtLeastOneFile } from "../../../utils/validators";

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
  // CHANGED: also pull submitClearance — this is what actually moves every
  // office's stage from "not_started" to "pending" so ClearanceProgress.jsx
  // has something real to show after this screen.
  const { formData, submitClearance, resetForm } = useClearanceForm();
  const { personal, academic, details, documents } = formData;

  const [submitError, setSubmitError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Boolean(validateEmail(personal.email)) || Boolean(validatePhone(personal.phone))) {
      setSubmitError("Your personal information is incomplete.");
      navigate("/clearance/personal");
      return;
    }
    if (
      Boolean(validateRequiredSelect(academic.yearOfStudy, "Year of study")) ||
      Boolean(validateRequiredSelect(academic.graduationYear, "Graduation year"))
    ) {
      setSubmitError("Your academic information is incomplete.");
      navigate("/clearance/personal"); // CHANGED: academic fields now live on the Personal step
      return;
    }
    if (Boolean(validateRequiredSelect(details.reason, "Reason for clearance"))) {
      setSubmitError("Your clearance details are incomplete.");
      navigate("/clearance/personal"); // CHANGED: reason also lives on the Personal step now
      return;
    }

    // CHANGED: check each REQUIRED office's own array, not one flat
    // documents.files list. Sends the student to the exact office step
    // that's missing something, not just a generic "documents" page.
    const missingOffice = DOCUMENT_OFFICES.find(
      (o) => o.required && Boolean(validateAtLeastOneFile(documents[o.key]))
    );
    if (missingOffice) {
      setSubmitError(`You need to attach at least one document for ${missingOffice.label}.`);
      navigate(`/clearance/office/${missingOffice.key}`);
      return;
    }

    setSubmitError("");
    // TODO: POST to the clearance-requests endpoint. On server rejection,
    // set submitError and DON'T call submitClearance/resetForm — keep the
    // student's data on screen so they don't lose it.
    submitClearance(); // moves every required office's stage to "pending"
    resetForm();
    navigate("/clearance/progress");
  };

  const lastOfficeKey = DOCUMENT_OFFICES[DOCUMENT_OFFICES.length - 1].key;

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
            <SummaryRow label="Department" value={currentUser.department} />
            <SummaryRow label="Year of study" value={academic.yearOfStudy} />
            <SummaryRow label="Expected graduation year" value={academic.graduationYear} />
            <SummaryRow label="Reason for clearance" value={details.reason} />
            <SummaryRow label="Additional information" value={details.notes} />

            {/* CHANGED: one row per office, generated from DOCUMENT_OFFICES
                instead of four hand-typed rows — adding a 5th office later
                means this list updates itself automatically. */}
            {DOCUMENT_OFFICES.map((office) => (
              <SummaryRow
                key={office.key}
                label={`${office.label} documents`}
                value={`${documents[office.key].length} file(s)`}
              />
            ))}
          </div>

          {submitError && <p className="text-[13px] text-danger">{submitError}</p>}

          <div className="flex gap-2.5">
            {/* CHANGED: Back now goes to the last office step, not the old /clearance/documents */}
            <Button type="button" variant="secondary" onClick={() => navigate(`/clearance/office/${lastOfficeKey}`)}>
              Back
            </Button>
            <Button type="submit">Submit clearance request</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}