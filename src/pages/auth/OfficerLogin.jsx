import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";

export default function OfficerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    // TODO: call the real auth endpoint here; on a wrong-credentials
    // response, do setErrors(prev => ({ ...prev, password: "Incorrect email or password." }))
    navigate("/officer/dashboard");
  };

  return (
    <AuthShell>
      <Card className="w-full p-10">
        <h2 className="text-[22px] font-semibold text-navy">Officer login</h2>
        <p className="text-[14.5px] text-navy-soft mb-2">
          Sign in with your office email to review requests assigned to your queue.
        </p>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col gap-5 mt-2">
          <Input
            label="Office email"
            required
            type="email"
            name="email"
            autoComplete="off"
            placeholder="finance.officer@must.ac.ug"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
            error={errors.email}
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
    </AuthShell>
  );
}