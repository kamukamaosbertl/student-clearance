import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { currentUser } from "../../../data/currentUser";
import { validateRequiredSelect } from "../../../utils/validators";

const YEARS_OF_STUDY = ["Year 1", "Year 2", "Year 3", "Final year"];
const GRADUATION_YEARS = ["2026", "2027", "2028"];

export default function AcademicInfoStep() {
  const navigate = useNavigate();
  const { formData, updateSection } = useClearanceForm();
  const { yearOfStudy, graduationYear } = formData.academic;

  // ── VALIDATION STATE ──────────────────────────────────────────────────
  const [errors, setErrors] = useState({ yearOfStudy: "", graduationYear: "" });

  const handleNext = (e) => {
    e.preventDefault();

    // ── VALIDATION: both dropdowns are required, use the same generic
    // "required select" rule with a field-specific label for the message ──
    const nextErrors = {
      yearOfStudy: validateRequiredSelect(yearOfStudy, "Year of study"),
      graduationYear: validateRequiredSelect(graduationYear, "Expected graduation year"),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    navigate("/clearance/details");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey="academic"
        title="Academic information"
        description="Faculty and department are drawn from your academic record."
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <div className="flex gap-5">
            {/* Read-only, sourced "from record" — no validation needed */}
            <Input label="Faculty" sourceLabel="from record" readOnly value={currentUser.faculty} className="w-[290px]" />
            <Input label="Department" sourceLabel="from record" readOnly value={currentUser.department} className="w-[290px]" />
          </div>

          <div className="flex gap-5">
            <Select
              label="Year of study"
              required
              value={yearOfStudy}
              onChange={(e) => {
                updateSection("academic", { yearOfStudy: e.target.value });
                // VALIDATION: clear the error the instant a valid choice is made —
                // selects don't have a natural "blur to re-check" moment like text
                // inputs, so we re-validate directly in onChange instead
                setErrors((prev) => ({ ...prev, yearOfStudy: "" }));
              }}
              error={errors.yearOfStudy}
              className="w-[290px]"
            >
              <option value="" disabled>
                Select year
              </option>
              {YEARS_OF_STUDY.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>

            <Select
              label="Expected graduation year"
              required
              value={graduationYear}
              onChange={(e) => {
                updateSection("academic", { graduationYear: e.target.value });
                setErrors((prev) => ({ ...prev, graduationYear: "" }));
              }}
              error={errors.graduationYear}
              className="w-[290px]"
            >
              <option value="" disabled>
                Select year
              </option>
              {GRADUATION_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2.5">
            {/* Going back never needs validation — the data already saved is fine as-is */}
            <Button type="button" variant="secondary" onClick={() => navigate("/clearance/personal")}>
              Back
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </WizardCard>
    </AppShell>
  );
}
