import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";

// ── Small inline icons, matching the hand-written style already used
// in LandingPage.jsx — no icon library installed.
function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="11" width="16" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return "";
}

function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return "";
}

/**
 * Shared login form for any office/admin-style role. Both
 * OfficerLogin and AdminLogin configure this instead of repeating
 * markup — pass a badgeLabel, title, subtitle, emailPlaceholder and
 * an onSubmit handler.
 *
 * NOTE: validation is self-contained here so it doesn't collide with
 * whatever utils/validators.js already does for the student wizard.
 * If that file already exports validateEmail/validatePassword in the
 * same shape, feel free to import those instead and delete the copy
 * above.
 */
export default function RoleLoginForm({
  badgeLabel,
  title,
  subtitle,
  emailPlaceholder = "you@must.ac.ug",
  onSubmit,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") setErrors((e) => ({ ...e, email: validateEmail(email) }));
    if (field === "password") setErrors((e) => ({ ...e, password: validatePassword(password) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });
    if (emailError || passwordError) return;

    setStatus("submitting");
    try {
      if (onSubmit) await onSubmit({ email, password, rememberMe });
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-border bg-white p-8 shadow-lg">
      <span className="mb-4 inline-block w-fit rounded-full bg-green-bg px-3 py-1 text-[12.5px] font-semibold text-teal-dark">
        {badgeLabel}
      </span>
      <h1 className="mb-1 text-[24px] font-bold text-navy">{title}</h1>
      <p className="mb-6 text-[13.5px] text-navy-soft">{subtitle}</p>

      {status === "success" ? (
        <div className="rounded-xl bg-green-bg px-4 py-4 text-center">
          <p className="text-[14px] font-semibold text-teal-dark">Signed in successfully.</p>
          <p className="mt-1 text-[12.5px] text-navy-soft">Redirecting to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="role-login-email" className="mb-1.5 block text-[13px] font-semibold text-navy">
              Email
            </label>
            <div
              className={`flex items-center gap-2.5 rounded-lg border px-3 ${
                touched.email && errors.email ? "border-red-400" : "border-border"
              } focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/15`}
            >
              <IconMail className="size-4.5 shrink-0 text-navy-soft" />
              <input
                id="role-login-email"
                type="email"
                autoComplete="email"
                placeholder={emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(touched.email && errors.email)}
                className="w-full bg-transparent py-2.5 text-[14px] text-navy outline-none placeholder:text-navy-soft/60"
              />
            </div>
            {touched.email && errors.email && (
              <p className="mt-1.5 text-[12px] text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="mb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="role-login-password" className="block text-[13px] font-semibold text-navy">
                Password
              </label>
              <button
                type="button"
                className="text-[12.5px] font-semibold text-teal hover:underline"
                onClick={() => console.log("Navigate to password reset flow")}
              >
                Forgot password?
              </button>
            </div>
            <div
              className={`flex items-center gap-2.5 rounded-lg border px-3 ${
                touched.password && errors.password ? "border-red-400" : "border-border"
              } focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/15`}
            >
              <IconLock className="size-4.5 shrink-0 text-navy-soft" />
              <input
                id="role-login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                aria-invalid={Boolean(touched.password && errors.password)}
                className="w-full bg-transparent py-2.5 text-[14px] text-navy outline-none placeholder:text-navy-soft/60"
              />
            </div>
            {touched.password && errors.password && (
              <p className="mt-1.5 text-[12px] text-red-500">{errors.password}</p>
            )}
          </div>

          <label className="mb-5 mt-3 flex w-fit items-center gap-2 text-[13px] text-navy-soft">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 accent-teal"
            />
            Remember me
          </label>

          {status === "error" && (
            <p className="mb-4 text-[13px] text-red-500">
              We couldn't sign you in. Check your details and try again.
            </p>
          )}

          <Button type="submit" className="w-full justify-center" disabled={status === "submitting"}>
            {status === "submitting" ? "Signing in…" : "Log in"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-[13px] text-navy-soft">
        Wrong portal?{" "}
        <Link to="/" className="font-semibold text-teal hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}