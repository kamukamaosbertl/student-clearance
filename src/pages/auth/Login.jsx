import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../../components/layout/AuthShell";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { validateRegNo, validatePassword } from "../../utils/validators";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [errors, setErrors] = useState({
    regNo: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const nextErrors = {
      regNo: validateRegNo(regNo),
      password: validatePassword(password),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(regNo, password);
      navigate("/dashboard");
    } catch (err) {
      // Backend sends { message: "..." } on 400/401/403/500
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
      {/* Back to landing page */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-1 flex w-fit items-center gap-2 text-[13.5px] font-semibold text-navy-soft transition-colors hover:text-teal"
      >
        <span aria-hidden="true">←</span>
        Back to home
      </button>

      {/* Page introduction */}
      <PageHeader
        eyebrow="Student Portal"
        title="Welcome back"
        description="Sign in to access your graduation clearance and track your progress."
      />

      {/* Login card */}
      <Card className="p-6 md:p-7">
        <div className="mb-6">
          <h2 className="text-[19px] font-semibold text-navy">
            Student login
          </h2>

          <p className="mt-1 text-[13.5px] leading-relaxed text-navy-soft">
            Enter your registration number and password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
          className="flex flex-col gap-5"
        >
          {/* Registration number */}
          <Input
            label="Registration number"
            required
            type="text"
            name="registrationNumber"
            autoComplete="off"
            placeholder="2023/BSE/058/PS"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                regNo: validateRegNo(regNo),
              }))
            }
            error={errors.regNo}
            hint="Example: 2023/BSE/058/PS"
          />

          {/* Password */}
          <Input
            label="Password"
            required
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                password: validatePassword(password),
              }))
            }
            error={errors.password}
          />

          {/* Server-side error (wrong credentials, inactive account, network issue) */}
          {serverError && (
            <p
              className="text-[13.5px] font-medium text-red-600"
              role="alert"
            >
              {serverError}
            </p>
          )}

          {/* Login button */}
          <Button
            type="submit"
            className="mt-1 w-full py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        {/* Help message */}
        <div className="mt-6 border-t border-border pt-5 text-center">
          <p className="text-[12.5px] leading-relaxed text-navy-soft">
            Having trouble accessing your account?
            <br />
            Please contact the appropriate university office for assistance.
          </p>
        </div>
      </Card>
    </AuthShell>
  );
}