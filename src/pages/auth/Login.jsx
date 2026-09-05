import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateRegNo, validatePassword } from "../../utils/validators";

export default function Login() {
  const navigate = useNavigate();
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ regNo: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = { regNo: validateRegNo(regNo), password: validatePassword(password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    // TODO: call the real auth endpoint here; on a wrong-credentials
    // response, do setErrors(prev => ({ ...prev, password: "Incorrect registration number or password." }))
    navigate("/clearance/personal");
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title="Clearance forms"
        description="Every screen a graduating student fills in, validated before it reaches the workflow."
      />

      <Card className="w-[420px]">
        <h2 className="text-[17px] font-semibold text-navy">Student login</h2>
        <p className="text-[13.5px] text-navy-soft">Sign in to continue to your dashboard.</p>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
          <Input
            label="Registration number"
            required
            type="text"
            name="registrationNumber"
            autoComplete="off"
            placeholder="2023/BSE/058/PS"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            onBlur={() => setErrors((prev) => ({ ...prev, regNo: validateRegNo(regNo) }))}
            error={errors.regNo}
            hint="Format: 2023/BSE/058/PS"
          />

          <Input
            label="Password"
            required
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setErrors((prev) => ({ ...prev, password: validatePassword(password) }))}
            error={errors.password}
          />

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}