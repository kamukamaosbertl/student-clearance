import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import FileDropzone from "../../../components/ui/FileDropzone";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { validateFiles, validateAtLeastOneFile } from "../../../utils/validators";

export default function DocumentsStep() {
  const navigate = useNavigate();
  const { formData, updateSection } = useClearanceForm();
  const { files } = formData.documents;

  // ── VALIDATION STATE ──────────────────────────────────────────────────
  const [error, setError] = useState("");

  const addFiles = (picked) => {
    // ── VALIDATION: check type + size the moment files are picked, not on
    // submit — rejects bad files immediately instead of letting the user
    // build up a pile of them and find out only at the end. ──────────────
    const fileErrors = validateFiles(picked);
    if (fileErrors.length > 0) {
      setError(fileErrors[0]); // show the first problem; all of them are logged below
      console.warn("Rejected files:", fileErrors);
      return; // don't add ANY of the bad batch
    }
    setError("");
    updateSection("documents", { files: [...files, ...picked] });
  };

  const removeFile = (index) => {
    updateSection("documents", { files: files.filter((_, i) => i !== index) });
    setError(""); // removing a file can't introduce a new error, safe to clear
  };

  const handleNext = (e) => {
    e.preventDefault();

    // ── VALIDATION: require at least one attached document before advancing ──
    const requiredError = validateAtLeastOneFile(files);
    setError(requiredError);
    if (requiredError) return;

    navigate("/clearance/review");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey="documents"
        title="Supporting documents"
        description="Exact document requirements are still to be confirmed with each MUST office — upload anything relevant for now."
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <FileDropzone
            label="Supporting document(s)"
            files={files}
            onAdd={addFiles}
            onRemove={removeFile}
            error={error}
          />

          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" onClick={() => navigate("/clearance/details")}>
              Back
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}
