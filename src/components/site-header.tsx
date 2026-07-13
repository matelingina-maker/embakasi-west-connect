import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/facilities", label: "Facilities" },
  { to: "/news", label: "News" },
] as const;

export function SiteHeader() {
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <>
      <aside className="bg-primary py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs md:text-sm font-medium text-primary-foreground/90 text-pretty">
            FY 2024/25 Bursary Application Window is now open. Deadline: 15th October.
          </p>
          <Link
            to="/services"
            className="text-xs font-semibold text-primary-foreground underline decoration-primary-foreground/40 underline-offset-4 hover:decoration-primary-foreground transition-all shrink-0"
          >
            Apply Now
          </Link>
        </div>
      </aside>

      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center font-black text-xl leading-none tracking-tight select-none">
              <span className="text-black">E</span>
              <span className="text-[oklch(0.52_0.22_27)]">W</span>
            </div>
            <span className="font-semibold tracking-tight whitespace-nowrap">E-WEST HUB</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q } });
            }}
            className="hidden md:flex flex-1 max-w-xs ml-auto"
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full h-9 px-3 rounded-md ring-1 ring-border bg-white text-sm"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {auth.user ? (
              <>
                {auth.isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium py-1.5 px-3 rounded hover:bg-muted transition-colors hidden sm:inline"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="text-sm font-medium py-1.5 px-3 ring-1 ring-border rounded hover:bg-muted transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium py-1.5 px-2 text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-medium py-1.5 px-3 bg-primary text-primary-foreground rounded hover:brightness-110 transition-all"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}