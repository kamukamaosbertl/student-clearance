import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

export default function OfficerLogin() {
  const navigate = useNavigate();
  const { staffLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);

    try {
      const user = await staffLogin(email, password);

      // Backend allows any non-student role through staff-login; make sure
      // this specific portal only accepts officers, not admins
      if (user.role !== "officer") {
        setServerError("This login is for officers only.");
        return;
      }

      navigate("/officer/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to log in. Please check your connection and try again.";
      setServerError(message);
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

          {serverError && (
            <p className="text-[13.5px] font-medium text-red-600" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}