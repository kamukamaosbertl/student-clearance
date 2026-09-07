import Header from "./Header";
import Footer from "../Footer";

// Used for pages that exist before authentication.
export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <div className="flex w-full max-w-[460px] flex-col gap-6 animate-page">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}