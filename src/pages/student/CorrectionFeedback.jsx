import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import FileDropzone from "../../components/ui/FileDropzone";
import { useClearanceForm } from "../../context/ClearanceFormContext";
import { OFFICES } from "../../data/offices";
import { validateAtLeastOneFile } from "../../utils/validators";
import { IconAlertTriangle, IconCheckCircle } from "../../components/icons";

export default function CorrectionFeedback() {
  const navigate = useNavigate();
  const { stages, resubmitStage } = useClearanceForm();

  // CHANGED: finds WHICHEVER office currently needs a correction, reading
  // real Context state — no longer hardcoded to Library. If nothing needs
  // correction, the student sees a clear "nothing to do" message instead
  // of a stale Library-specific screen.
  const officeKey = Object.keys(stages).find((key) => stages[key].status === "correction");
  const office = OFFICES.find((o) => o.key === officeKey);

  const [proofFiles, setProofFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!office) {
    return (
      <AppShell>
        <PageHeader eyebrow="Student" title="Correction / feedback" />
        <Card className="w-[660px]">
          <p className="text-[13.5px] text-body">Nothing needs your attention right now.</p>
        </Card>
      </AppShell>
    );
  }

  const addFiles = (picked) => {
    setProofFiles((prev) => [...prev, ...picked]);
    setFileError("");
  };
  const removeFile = (index) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResubmit = (e) => {
    e.preventDefault();

    const error = validateAtLeastOneFile(proofFiles);
    setFileError(error);
    if (error) return;

    // CHANGED: actually updates shared state now — only THIS office's
    // stage moves back to "pending", every already-approved office stays
    // untouched. Before, this only set local `submitted` state and never
    // told the rest of the app anything happened.
    resubmitStage(office.key);
    setSubmitted(true);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title="Correction / feedback"
        description={`${office.label} has requested a correction. Resolve it and resubmit to continue.`}
      />

      <Card className="w-[660px]">
        {submitted ? (
          <div className="flex flex-col items-start gap-3">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-bg px-2.5 py-1 text-[12.5px] font-semibold text-teal-dark">
              <IconCheckCircle className="size-3.5" /> Resubmitted to {office.label}
            </span>
            <p className="text-[13.5px] text-body">
              {office.label} will review your update. You'll be notified once they've made a decision.
            </p>
            <Button variant="secondary" onClick={() => navigate("/clearance/progress")}>
              Back to progress
            </Button>
          </div>
        ) : (
          <>
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-bg px-2.5 py-1 text-[12.5px] font-semibold text-red-text">
              <IconAlertTriangle className="size-3.5" /> Correction required · {office.label}
            </span>

            <div className="rounded-field bg-surface px-3.5 py-3">
              <p className="text-[13.5px] text-navy">
                {stages[office.key].note || `${office.label} needs additional or corrected documents from you.`}
              </p>
            </div>

            <form onSubmit={handleResubmit} noValidate className="flex flex-col gap-[18px]">
              <FileDropzone
                label={`Upload corrected document for ${office.label} *`}
                files={proofFiles}
                onAdd={addFiles}
                onRemove={removeFile}
                error={fileError}
              />

              <Textarea
                label={`Message to ${office.label}`}
                placeholder="Add any context for the officer..."
                hint="Optional"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <Button type="submit" className="w-fit">
                Resubmit to {office.label}
              </Button>
            </form>
          </>
        )}
      </Card>
    </AppShell>
  );
}