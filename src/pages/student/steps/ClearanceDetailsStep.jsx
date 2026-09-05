import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { validateRequiredSelect } from "../../../utils/validators";

// "Reason for clearance" options — not specified in the Figma frame itself,
// so these are inferred from the project plan's clearance purpose (graduation).
const CLEARANCE_REASONS = ["Final graduation clearance", "Provisional clearance", "Transfer clearance", "Other"];

export default function ClearanceDetailsStep() {
  const navigate = useNavigate();
  const { formData, updateSection } = useClearanceForm();
  const { reason, notes } = formData.details;

  // ── VALIDATION STATE ──────────────────────────────────────────────────
  // Only "reason" is required (marked with * in the Figma frame).
  // "Additional information" is optional in the design, so it has no
  // error state at all — see the note on Textarea below.
  const [reasonError, setReasonError] = useState("");

  const handleNext = (e) => {
    e.preventDefault();

    // ── VALIDATION: single required field ──────────────────────────────
    const error = validateRequiredSelect(reason, "Reason for clearance");
    setReasonError(error);
    if (error) return;

    navigate("/clearance/documents");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey="details"
        title="Clearance details"
        description="Offices verify their own requirements — this just starts the process."
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <Select
            label="Reason for clearance"
            required
            value={reason}
            onChange={(e) => {
              updateSection("details", { reason: e.target.value });
              setReasonError(""); // clear as soon as a value is picked
            }}
            error={reasonError}
            className="w-[600px]"
          >
            <option value="" disabled>
              Select a reason
            </option>
            {CLEARANCE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          {/* VALIDATION: intentionally none — this field is optional per the
              Figma copy ("Optional — anything an office should know before
              reviewing."). If it ever becomes required, add a maxLength rule
              to validators.js (e.g. validateNotes) and pass its result as
              `error` here, same pattern as the Select above. */}
          <Textarea
            label="Additional information"
            placeholder="Optional notes for the reviewing offices..."
            hint="Optional — anything an office should know before reviewing."
            value={notes}
            onChange={(e) => updateSection("details", { notes: e.target.value })}
            className="w-[600px]"
          />

          <div className="flex gap-2.5">
            <Button type="button" variant="secondary" onClick={() => navigate("/clearance/academic")}>
              Back
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}
