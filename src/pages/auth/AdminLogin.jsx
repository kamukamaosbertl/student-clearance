import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";
import { login } from "../../services/authApi";

// Placeholder page so the role menu doesn't dead-end. Per the build
// order, Admin screens come last — flesh this out (account
// management, monitoring, reports) when you get there.
export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const nextErrors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await login({ login: email, password, role: "admin" });
      navigate("/admin/dashboard");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <Card className="w-full">
        <h2 className="text-[17px] font-semibold text-navy">Admin login</h2>
        <p className="text-[13.5px] text-navy-soft">
          Sign in to manage accounts, monitor transactions, and view reports.
        </p>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
          <Input
            label="Admin email"
            required
            type="email"
            name="email"
            autoComplete="off"
            placeholder="admin@must.ac.ug"
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Log in"}
          </Button>
          {serverError && <p className="text-[13px] text-red-500">{serverError}</p>}
        </form>
      </Card>
    </AuthShell>
  );
}