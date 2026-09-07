import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../../components/layout/AppShell";
import PageHeader from "../../../components/layout/PageHeader";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Textarea from "../../../components/ui/Textarea";
import Button from "../../../components/ui/Button";
import WizardCard from "../WizardCard";
import { useClearanceForm } from "../../../context/ClearanceFormContext";
import { currentUser } from "../../../data/currentUser";
import { validateEmail, validatePhone, validateRequiredSelect } from "../../../utils/validators";

const YEARS_OF_STUDY = ["Year 1", "Year 2", "Year 3", "Final year"];
const GRADUATION_YEARS = ["2026", "2027", "2028"];
const CLEARANCE_REASONS = ["Final graduation clearance", "Provisional clearance", "Transfer clearance", "Other"];

export default function PersonalInfoStep() {
  const navigate = useNavigate();
  const { formData, updateSection, startClearance } = useClearanceForm();
  const { email, phone } = formData.personal;
  const { yearOfStudy, graduationYear } = formData.academic;
  const { reason, notes } = formData.details;

  // NEW: marks the wizard as "started" the moment this step is reached —
  // covers both the Dashboard button AND someone typing this URL
  // directly, so the Sidebar's lock logic can't be bypassed either way.
  useEffect(() => {
    startClearance();
  }, [startClearance]);

  const [errors, setErrors] = useState({
    email: "", phone: "", yearOfStudy: "", graduationYear: "", reason: "",
  });

  const handleNext = (e) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      phone: validatePhone(phone),
      yearOfStudy: validateRequiredSelect(yearOfStudy, "Year of study"),
      graduationYear: validateRequiredSelect(graduationYear, "Expected graduation year"),
      reason: validateRequiredSelect(reason, "Reason for clearance"),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    navigate("/clearance/office/finance");
  };

  return (
    <AppShell>
      <PageHeader eyebrow="Student" title="Clearance forms" />

      <WizardCard
        stepKey="personal"
        title="Personal information"
        description="Your account and academic record — offices don't see this until you submit."
      >
        <form onSubmit={handleNext} noValidate className="flex flex-col gap-[18px]">
          <div className="flex gap-5">
            <Input label="Student ID" sourceLabel="from account" readOnly value={currentUser.studentId} className="w-[270px]" />
            <Input label="Full name" sourceLabel="from account" readOnly value={currentUser.fullName} className="w-[270px]" />
          </div>
          <Input label="Programme" sourceLabel="from account" readOnly value={currentUser.programme} className="w-[600px]" />

          <div className="flex gap-5">
            <Input label="Faculty" sourceLabel="from record" readOnly value={currentUser.faculty} className="w-[290px]" />
            <Input label="Department" sourceLabel="from record" readOnly value={currentUser.department} className="w-[290px]" />
          </div>

          <div className="flex gap-5">
            <Input
              label="Email address" required type="email" placeholder="you@must.ac.ug"
              value={email}
              onChange={(e) => updateSection("personal", { email: e.target.value })}
              onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
              error={errors.email}
              className="w-[290px]"
            />
            <Input
              label="Phone number" required type="tel" placeholder="0700123456"
              value={phone}
              onChange={(e) => updateSection("personal", { phone: e.target.value })}
              onBlur={() => setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }))}
              error={errors.phone}
              className="w-[290px]"
            />
          </div>

          <div className="flex gap-5">
            <Select
              label="Year of study" required value={yearOfStudy}
              onChange={(e) => {
                updateSection("academic", { yearOfStudy: e.target.value });
                setErrors((prev) => ({ ...prev, yearOfStudy: "" }));
              }}
              error={errors.yearOfStudy}
              className="w-[290px]"
            >
              <option value="" disabled>Select year</option>
              {YEARS_OF_STUDY.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select
              label="Expected graduation year" required value={graduationYear}
              onChange={(e) => {
                updateSection("academic", { graduationYear: e.target.value });
                setErrors((prev) => ({ ...prev, graduationYear: "" }));
              }}
              error={errors.graduationYear}
              className="w-[290px]"
            >
              <option value="" disabled>Select year</option>
              {GRADUATION_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>

          <Select
            label="Reason for clearance" required value={reason}
            onChange={(e) => {
              updateSection("details", { reason: e.target.value });
              setErrors((prev) => ({ ...prev, reason: "" }));
            }}
            error={errors.reason}
            className="w-[600px]"
          >
            <option value="" disabled>Select a reason</option>
            {CLEARANCE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Textarea
            label="Additional information"
            placeholder="Optional notes for the reviewing offices..."
            hint="Optional — anything an office should know before reviewing."
            value={notes}
            onChange={(e) => updateSection("details", { notes: e.target.value })}
            className="w-[600px]"
          />

          <Button type="submit" className="self-start">Next: Finance</Button>
        </form>
      </WizardCard>
    </AppShell>
  );
}