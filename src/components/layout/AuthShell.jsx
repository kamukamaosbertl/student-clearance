import Header from "./Header";
import Footer from "../Footer";

// Lightweight shell for standalone auth screens (Officer/Admin login,
// password reset, etc.) — reuses the same Header as AppShell, but
// skips the Sidebar entirely and centers its content like a real
// login page instead of a dashboard's left-aligned main area.
//
// Use AppShell for anything the user sees *after* logging in
// (dashboards, queues, wizards); use AuthShell for the login screens
// themselves.
export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <div className="flex w-full max-w-[560px] flex-col gap-6 animate-page">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}