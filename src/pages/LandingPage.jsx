import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import RoleMenu from "../components/ui/RoleMenu";
import Brand from "../components/layout/Brand";
import Footer from "../components/Footer";

import {
  IconDocument,
  IconBuilding,
  IconBell,
  IconShield,
  IconClock,
  IconCheckCircle,
} from "../components/icons";

import heroImage from "../assets/hero.jpg";
import submitImage from "../assets/submit.jpg";
import reviewImage from "../assets/review.jpg";
import clearedImage from "../assets/cleared.jpg";
import clearanceGuideImage from "../assets/MUST Clearance Step-Guide Infographic.png";

const steps = [
  {
    icon: IconDocument,
    image: submitImage,
    title: "Submit once",
    text: "Fill in your personal, academic and clearance details, upload documents, done.",
  },
  {
    icon: IconBuilding,
    image: reviewImage,
    title: "Offices review",
    text: "Finance, Library, Department, Student Affairs and the Registrar each verify their part.",
  },
  {
    icon: IconBell,
    image: reviewImage,
    title: "Respond if needed",
    text: "If an office needs something fixed, you'll be told exactly what and can resubmit.",
  },
  {
    icon: IconCheckCircle,
    image: clearedImage,
    title: "Get cleared",
    text: "Once every office signs off, your clearance is complete — no extra visits required.",
  },
];

const features = [
  {
    icon: IconDocument,
    title: "Submit once",
    text: "One form reaches every office — no repeating yourself at five different desks.",
  },
  {
    icon: IconClock,
    title: "Track live",
    text: "See exactly which office has your request and what stage it's at, any time.",
  },
  {
    icon: IconBell,
    title: "Get notified",
    text: "Know the moment a stage is approved or needs your attention — no guessing.",
  },
  {
    icon: IconShield,
    title: "Secure by design",
    text: "Every office only ever sees the requests assigned to them.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">

      {/* ==================== NAVIGATION ==================== */}
      <header className="border-b border-border bg-white px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-[1160px] items-center gap-8">
          <Brand />

          <nav className="ml-auto hidden items-center gap-7 text-[14px] font-semibold text-navy md:flex">
            <a
              href="#how-it-works"
              className="transition-all duration-200 hover:-translate-y-0.5 hover:text-teal"
            >
              How it works
            </a>

            <a
              href="#features"
              className="transition-all duration-200 hover:-translate-y-0.5 hover:text-teal"
            >
              Why it helps
            </a>
          </nav>

          {/* Was: <Link to="/login"><Button>Log in</Button></Link>
              Now opens a role picker (Student / Officer / Admin) that
              routes to the matching login page. */}
          <RoleMenu className="ml-2 md:ml-0" />
        </div>
      </header>


      {/* ==================== HERO ==================== */}
      <section className="animate-page px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-[1160px] items-center gap-14 md:grid-cols-2">

          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-green-bg px-3 py-1 text-[12.5px] font-semibold text-teal-dark transition-transform duration-300 hover:scale-[1.02]">
              Mbarara University of Science and Technology
            </span>

            <h1 className="text-[38px] font-bold leading-[1.15] text-navy md:text-[46px]">
              Get Cleared. Track Everything.
              <br />
              Graduate With Ease.
            </h1>

            <p className="max-w-[440px] text-[15.5px] leading-relaxed text-navy-soft">
              Complete your graduation clearance online, track your progress
              across every office, and know exactly what needs your attention
              — all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button className="px-7 py-3 text-[15px] transition-transform duration-200 hover:-translate-y-1">
                  Start your clearance
                </Button>
              </Link>

              <a href="#how-it-works">
                <Button
                  variant="secondary"
                  className="px-7 py-3 text-[15px] transition-transform duration-200 hover:-translate-y-1"
                >
                  See how it works
                </Button>
              </a>
            </div>
          </div>


          {/* Animated hero visual */}
          <div className="relative mx-auto flex h-[360px] w-full max-w-[460px] items-center justify-center">

            {/* Soft background shape */}
            <div
              className="absolute inset-3 rounded-[34px] bg-green-bg transition-transform duration-700 hover:scale-[1.03]"
              aria-hidden="true"
            />

            {/* Floating image */}
            <img
              src={heroImage}
              alt="Student completing university clearance online"
              className="relative z-10 max-h-[340px] w-full object-contain animate-float transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>


      {/* ==================== CLEARANCE GUIDE ==================== */}
      <section className="border-y border-border bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-[1160px]">

          <div className="mx-auto mb-8 max-w-[560px] text-center animate-page">
            <p className="text-[13px] font-semibold text-teal">
              Your clearance journey
            </p>

            <h2 className="mt-1 text-[28px] font-bold text-navy">
              See how the process works
            </h2>
          </div>


          {/* Interactive guide image */}
          <div className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
            <img
              src={clearanceGuideImage}
              alt="MUST Clearance step-by-step guide"
              className="block h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />
          </div>
        </div>
      </section>


      {/* ==================== HOW IT WORKS ==================== */}
      <section id="how-it-works" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1160px]">

          <div className="mx-auto mb-12 max-w-[560px] text-center animate-page">
            <p className="text-[13px] font-semibold text-teal">
              How it works
            </p>

            <h2 className="mt-1 text-[28px] font-bold text-navy">
              From submission to graduation
            </h2>
          </div>


          <div className="relative grid gap-6 md:grid-cols-4">

            <div
              className="pointer-events-none absolute left-[12%] right-[12%] top-11 hidden border-t border-dashed border-border md:block"
              aria-hidden="true"
            />

            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group animate-page relative z-10 rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-teal/30 hover:shadow-xl"
                style={{ animationDelay: `${i * 0.08}s` }}
              >

                {/* Step image — KEPT AS YOUR ORIGINAL IMAGES */}
                <div className="mb-4 h-28 overflow-hidden rounded-xl bg-green-bg">
                  <img
                    src={step.image}
                    alt=""
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    aria-hidden="true"
                  />
                </div>

                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-green-bg text-teal-dark transition-all duration-300 group-hover:scale-110 group-hover:bg-teal group-hover:text-white">
                  <step.icon className="size-5" />
                </div>

                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gold-dark">
                  Step {i + 1}
                </p>

                <h3 className="mb-1.5 text-[15px] font-semibold text-navy">
                  {step.title}
                </h3>

                <p className="text-[13.5px] leading-relaxed text-navy-soft">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== FEATURES ==================== */}
      <section id="features" className="bg-white px-6 py-20 md:px-12">
        <div className="mx-auto max-w-[1160px]">

          <div className="mx-auto mb-12 max-w-[560px] text-center animate-page">
            <p className="text-[13px] font-semibold text-teal">
              Why it helps
            </p>

            <h2 className="mt-1 text-[28px] font-bold text-navy">
              Built around one idea: submit once
            </h2>
          </div>


          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group animate-page rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-2 hover:border-teal/30 hover:bg-white hover:shadow-xl"
                style={{ animationDelay: `${i * 0.08}s` }}
              >

                {/* Animated feature icon */}
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-teal text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="size-5.5 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <h3 className="mb-1.5 text-[15px] font-semibold text-navy transition-colors duration-200 group-hover:text-teal">
                  {f.title}
                </h3>

                <p className="text-[13.5px] leading-relaxed text-navy-soft">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== CLOSING CTA ==================== */}
      <section className="bg-teal px-6 py-16 text-center md:px-12">
        <div className="animate-page">

          <h2 className="mx-auto max-w-[480px] text-[26px] font-bold text-white">
            Ready to get your clearance moving?
          </h2>

          <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] text-white/80">
            Log in with your registration number and start your request in
            minutes.
          </p>

          <Link to="/login">
            <Button
              variant="secondary"
              className="mt-6 !border-white !bg-white px-7 py-3 text-[15px] !text-teal transition-all duration-300 hover:-translate-y-1 hover:!bg-white/90 hover:shadow-lg"
            >
              Log in to start
            </Button>
          </Link>
        </div>
      </section>


      {/* ==================== FOOTER ==================== */}
      <Footer />
    </div>
  );
}