import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import WizardCard from "../WizardCard";
import FileDropzone from "../../../components/ui/FileDropzone";
import Button from "../../../components/ui/Button";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { DOCUMENT_OFFICES } from "../../../data/offices";
import { validateFiles, validateAtLeastOneFile } from "../../../utils/validators";

export default function OfficeDocumentsStep() {
  const { officeKey } = useParams();
  const navigate = useNavigate();
  const { formData, updateSection } = useClearanceForm();
  const [error, setError] = useState("");

  const index = DOCUMENT_OFFICES.findIndex((o) => o.key === officeKey);
  const office = DOCUMENT_OFFICES[index];

  // Unknown office in the URL — bounce back to the start of the wizard
  // rather than rendering a broken/blank page.
  if (!office) return <Navigate to="/clearance/personal" replace />;

  const files = formData.documents[office.key];
  const prevPath = index === 0 ? "/clearance/personal" : `/clearance/office/${DOCUMENT_OFFICES[index - 1].key}`;
  const nextPath = index === DOCUMENT_OFFICES.length - 1 ? "/clearance/review" : `/clearance/office/${DOCUMENT_OFFICES[index + 1].key}`;

  const addFiles = (picked) => {
    const fileErrors = validateFiles(picked);
    if (fileErrors.length > 0) {
      setError(fileErrors[0]);
      return;
    }
    setError("");
    updateSection("documents", { [office.key]: [...files, ...picked] });
  };
  const removeFile = (i) => updateSection("documents", { [office.key]: files.filter((_, idx) => idx !== i) });

  const handleNext = (e) => {
    e.preventDefault();
    if (office.required) {
      const requiredError = validateAtLeastOneFile(files);
      setError(requiredError);
      if (requiredError) return;
    }
    navigate(nextPath);
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey={office.key}
        title={`${office.label} requirements`}
        description={office.required ? "Required for clearance." : "Optional — only if this applies to you."}
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <FileDropzone
            label={`${office.label} documents${office.required ? " *" : ""}`}
            hint={office.hint}
            files={files}
            onAdd={addFiles}
            onRemove={removeFile}
            error={error}
          />
          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" onClick={() => navigate(prevPath)}>Back</Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}