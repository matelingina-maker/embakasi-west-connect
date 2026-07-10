import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/news", label: "News" },
] as const;

export function SiteHeader() {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-sm flex items-center justify-center">
              <div className="size-3 bg-primary-foreground/30 rounded-full" />
            </div>
            <span className="font-semibold tracking-tight">E-WEST HUB</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
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

          <Link
            to="/contact"
            className="text-sm font-medium py-1.5 px-3 ring-1 ring-border rounded hover:bg-muted transition-colors"
          >
            Contact Office
          </Link>
        </div>
      </nav>
    </>
  );
}