import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";
import { login } from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

export default function OfficerLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
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
      const result = await login({ login: email, password, role: "officer" });
      setUser(result.user);
      navigate("/officer/dashboard");
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsSubmitting(false);
    }
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Log in"}
          </Button>
          {serverError && <p className="text-[13px] text-red-500">{serverError}</p>}
        </form>
      </Card>
    </AuthShell>
  );
}