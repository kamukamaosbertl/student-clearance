import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

// Per the build order, Admin screens come last — flesh this out
// (account management, monitoring, reports) when you get there.
export default function AdminLogin() {
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
      // this specific portal only accepts admins, not officers
      if (user.role !== "admin") {
        setServerError("This login is for administrators only.");
        return;
      }

      // TODO: point this at the real admin dashboard route once it exists
      navigate("/admin/dashboard");
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
        <h2 className="text-[22px] font-semibold text-navy">Admin login</h2>
        <p className="text-[14.5px] text-navy-soft mb-2">
          Sign in to manage accounts, monitor transactions, and view reports.
        </p>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="flex flex-col gap-5 mt-2">
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