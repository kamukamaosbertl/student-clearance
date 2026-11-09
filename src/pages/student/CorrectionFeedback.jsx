import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import FileDropzone from "../../components/ui/FileDropzone";
import StageHistory from "../../components/clearance/StageHistory";
import { useClearanceForm } from "../../context/ClearanceFormContext";
import { apiErrorMessage } from "../../api/client";
import { NEEDS_STUDENT } from "../../utils/status";
import { validateFiles } from "../../utils/validators";
import { IconAlertTriangle, IconCheckCircle } from "../../components/icons";

// Section 7.8 — the student responds to an office that requested a
// correction (or rejected the stage). Only that office's stage goes back
// into its queue; offices that already approved stay approved.
export default function CorrectionFeedback() {
  const navigate = useNavigate();
  const { application, hasLoaded, resubmitStage } = useClearanceForm();

  const stage = application?.stages.find((s) => NEEDS_STUDENT.includes(s.status));

  const [proofFiles, setProofFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (submittedTo) {
    return (
      <AppShell>
        <PageHeader eyebrow="Student" title="Correction / feedback" />
        <Card className="w-[660px]">
          <div className="flex flex-col items-start gap-3">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-bg px-2.5 py-1 text-[12.5px] font-semibold text-teal-dark">
              <IconCheckCircle className="size-3.5" /> Resubmitted to {submittedTo}
            </span>
            <p className="text-[13.5px] text-body">
              {submittedTo} will review your update. You'll be notified once they've made a decision.
            </p>
            <Button variant="secondary" onClick={() => navigate("/clearance/progress")}>
              Back to progress
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (!hasLoaded || !stage) {
    return (
      <AppShell>
        <PageHeader eyebrow="Student" title="Correction / feedback" />
        <Card className="w-[660px]">
          <p className="text-[13.5px] text-body">
            {hasLoaded ? "Nothing needs your attention right now." : "Loading…"}
          </p>
        </Card>
      </AppShell>
    );
  }

  const office = stage.office;
  const isRejected = stage.status === "rejected";
  const fileRequired = office.requiresDocuments && isRejected;

  const addFiles = (picked) => {
    const errors = validateFiles(picked);
    if (errors.length > 0) {
      setFileError(errors[0]);
      return;
    }
    setProofFiles((prev) => [...prev, ...picked]);
    setFileError("");
  };
  const removeFile = (index) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (fileRequired && proofFiles.length === 0) {
      setFileError("Attach at least one corrected document.");
      return;
    }
    if (proofFiles.length === 0 && !message.trim()) {
      setFileError("Attach a corrected document or write a message to the office.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resubmitStage(stage.id, proofFiles, message);
      setSubmittedTo(office.name);
    } catch (error) {
      setServerError(apiErrorMessage(error, "Your response could not be sent."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title="Correction / feedback"
        description={`${office.name} has ${isRejected ? "rejected this stage" : "requested a correction"}. Resolve it and resubmit to continue.`}
      />

      <Card className="w-[660px]">
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-bg px-2.5 py-1 text-[12.5px] font-semibold text-red-text">
          <IconAlertTriangle className="size-3.5" /> {isRejected ? "Rejected" : "Correction required"} · {office.name}
        </span>

        <div className="rounded-field bg-surface px-3.5 py-3">
          <p className="text-[13.5px] text-navy">
            {stage.comment || `${office.name} needs additional or corrected documents from you.`}
          </p>
        </div>

        <form onSubmit={handleResubmit} noValidate className="flex flex-col gap-[18px]">
          <FileDropzone
            label={`Upload corrected document for ${office.name}${fileRequired ? " *" : ""}`}
            files={proofFiles}
            onAdd={addFiles}
            onRemove={removeFile}
            error={fileError}
          />

          <Textarea
            label={`Message to ${office.name}`}
            placeholder="Add any context for the officer..."
            hint="Optional if you attach a document"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {serverError && <p className="text-[13px] text-danger">{serverError}</p>}

          <Button type="submit" className="w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : `Resubmit to ${office.name}`}
          </Button>
        </form>
      </Card>

      <Card className="w-[660px]">
        <h3 className="text-[15px] font-semibold text-navy">History with {office.name}</h3>
        <StageHistory events={stage.events} />
      </Card>
    </AppShell>
  );
}
