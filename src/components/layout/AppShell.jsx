import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "../Footer";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-10 py-8">
          {/* animate-page = fade + slide up on load, defined in index.css.
              Since every screen renders through AppShell, this one line
              gives every page in the app the same entrance animation. */}
          <div className="flex max-w-[1040px] flex-col gap-6 animate-page">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}