import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import RoleMenu from "../components/ui/RoleMenu";
import Brand from "../components/layout/Brand";

// ── Small inline icon set — no icon library installed, so these are
// hand-written minimal outline icons in currentColor, sized to inherit
// color from their parent via text-* classes.
function IconDocument(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 21v-3h4v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheckCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const steps = [
  { icon: IconDocument, title: "Submit once", text: "Fill in your personal, academic and clearance details, upload documents, done." },
  { icon: IconBuilding, title: "Offices review", text: "Finance, Library, Department, Student Affairs and the Registrar each verify their part." },
  { icon: IconBell, title: "Respond if needed", text: "If an office needs something fixed, you'll be told exactly what and can resubmit." },
  { icon: IconCheckCircle, title: "Get cleared", text: "Once every office signs off, your clearance is complete — no extra visits required." },
];

const features = [
  { icon: IconDocument, title: "Submit once", text: "One form reaches every office — no repeating yourself at five different desks." },
  { icon: IconClock, title: "Track live", text: "See exactly which office has your request and what stage it's at, any time." },
  { icon: IconBell, title: "Get notified", text: "Know the moment a stage is approved or needs your attention — no guessing." },
  { icon: IconShield, title: "Secure by design", text: "Every office only ever sees the requests assigned to them." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-white px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-[1160px] items-center gap-8">
          <Brand />

          <nav className="ml-auto hidden items-center gap-7 text-[14px] font-semibold text-navy md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-teal">How it works</a>
            <a href="#features" className="transition-colors hover:text-teal">Why it helps</a>
          </nav>

          {/* Was: <Link to="/login"><Button>Log in</Button></Link>
              Now opens a role picker (Student / Officer / Admin) that
              routes to the matching login page. */}
          <RoleMenu className="ml-2 md:ml-0" />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="animate-page px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-[1160px] items-center gap-14 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-green-bg px-3 py-1 text-[12.5px] font-semibold text-teal-dark">
              Mbarara University of Science and Technology
            </span>
            <h1 className="text-[38px] font-bold leading-[1.15] text-navy md:text-[46px]">
              One request. Five offices.<br />Zero queues.
            </h1>
            <p className="max-w-[440px] text-[15.5px] leading-relaxed text-navy-soft">
              Submit your graduation clearance once and track every office's decision in
              real time — no more chasing signatures across campus.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button className="px-7 py-3 text-[15px]">Start your clearance</Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" className="px-7 py-3 text-[15px]">See how it works</Button>
              </a>
            </div>
          </div>

          {/* Illustration — abstract floating cards, no external images */}
          <div className="relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center">
            <div className="absolute inset-0 rounded-[32px] bg-green-bg" aria-hidden="true" />
            <div className="animate-float absolute left-4 top-6 flex w-[210px] items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-lg">
              <IconCheckCircle className="size-8 text-teal" />
              <div>
                <p className="text-[13px] font-semibold text-navy">Finance</p>
                <p className="text-[11.5px] text-navy-soft">Approved</p>
              </div>
            </div>
            <div
              className="animate-float absolute bottom-8 right-2 flex w-[210px] items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-lg"
              style={{ animationDelay: "1.3s" }}
            >
              <IconClock className="size-8 text-gold-dark" />
              <div>
                <p className="text-[13px] font-semibold text-navy">Library</p>
                <p className="text-[11.5px] text-navy-soft">In review</p>
              </div>
            </div>
            <div
              className="animate-float absolute bottom-24 left-10 flex w-[170px] items-center gap-3 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-lg"
              style={{ animationDelay: "0.6s" }}
            >
              <IconBuilding className="size-7 text-navy-soft" />
              <p className="text-[12px] font-semibold text-navy">Registrar</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-white px-6 py-10 md:px-12">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            ["5", "offices, one workflow"],
            ["1", "form to fill in"],
            ["0", "physical queues"],
            ["24/7", "progress tracking"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="text-[28px] font-bold text-teal">{num}</p>
              <p className="text-[13px] text-navy-soft">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1160px]">
          <div className="mx-auto mb-12 max-w-[560px] text-center">
            <p className="text-[13px] font-semibold text-teal">How it works</p>
            <h2 className="mt-1 text-[28px] font-bold text-navy">From submission to graduation</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="animate-page rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-green-bg text-teal-dark">
                  <step.icon className="size-5.5" />
                </div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gold-dark">Step {i + 1}</p>
                <h3 className="mb-1.5 text-[15px] font-semibold text-navy">{step.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-navy-soft">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1160px]">
          <div className="mx-auto mb-12 max-w-[560px] text-center">
            <p className="text-[13px] font-semibold text-teal">Why it helps</p>
            <h2 className="mt-1 text-[28px] font-bold text-navy">Built around one idea: submit once</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-page rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-teal/30 hover:shadow-lg"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-teal text-white">
                  <f.icon className="size-5.5" />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold text-navy">{f.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-navy-soft">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA band ───────────────────────────────────────── */}
      <section className="bg-teal px-6 py-16 text-center md:px-12">
        <h2 className="mx-auto max-w-[480px] text-[26px] font-bold text-white">
          Ready to get your clearance moving?
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] text-white/80">
          Log in with your registration number and start your request in minutes.
        </p>
        <Link to="/login">
          <Button
            variant="secondary"
            className="mt-6 !border-white !bg-white px-7 py-3 text-[15px] !text-teal hover:!bg-white/90"
          >
            Log in to start
          </Button>
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white px-6 py-8 text-center md:px-12">
        <p className="text-[13px] text-navy-soft">
          MUST Clearance · Mbarara University of Science and Technology
        </p>
      </footer>
    </div>
  );
}