import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { currentUser } from "../../../data/currentUser";
import { validateEmail, validatePhone } from "../../../utils/validators";

export default function PersonalInfoStep() {
  const navigate = useNavigate();
  const { formData, updateSection } = useClearanceForm();
  const { email, phone } = formData.personal;

  // ── VALIDATION STATE ──────────────────────────────────────────────────
  // Only the two editable fields need errors — Student ID / Full name /
  // Programme are read-only (sourced "from account"), so they're never
  // user input and never need validating here.
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const handleNext = (e) => {
    e.preventDefault();

    // ── VALIDATION: run before advancing the wizard ────────────────────
    const nextErrors = { email: validateEmail(email), phone: validatePhone(phone) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return; // block navigation on error

    navigate("/clearance/academic");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey="personal"
        title="Personal information"
        description="Your student ID, name and programme come from your account and can't be edited here."
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <div className="flex gap-5">
            {/* Read-only fields: no validation needed, they can't be edited */}
            <Input label="Student ID" sourceLabel="from account" readOnly value={currentUser.studentId} className="w-[270px]" />
            <Input label="Full name" sourceLabel="from account" readOnly value={currentUser.fullName} className="w-[270px]" />
          </div>

          <Input label="Programme" sourceLabel="from account" readOnly value={currentUser.programme} className="w-[600px]" />

          <div className="flex gap-5">
            <Input
              label="Email address"
              required
              type="email"
              placeholder="you@must.ac.ug"
              value={email}
              onChange={(e) => updateSection("personal", { email: e.target.value })}
              // VALIDATION: re-check on blur so the error clears/updates without
              // waiting for the user to hit "Next" again
              onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
              error={errors.email}
              className="w-[290px]"
            />
            <Input
              label="Phone number"
              required
              type="tel"
              placeholder="0700123456"
              value={phone}
              onChange={(e) => updateSection("personal", { phone: e.target.value })}
              onBlur={() => setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }))}
              error={errors.phone}
              className="w-[290px]"
            />
          </div>

          <Button type="submit" className="self-start">
            Next
          </Button>
        </form>
      </WizardCard>
    </AppShell>
  );
}
