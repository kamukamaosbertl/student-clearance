import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/layout/AuthShell";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateEmail, validatePassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

// Placeholder page so the role menu doesn't dead-end. Per the build
// order, Admin screens come last — flesh this out (account
// management, monitoring, reports) when you get there.
export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
    // TODO: point this at the real admin dashboard route once it exists
    login("admin");
    navigate("/admin/dashboard");
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

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}