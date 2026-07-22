import { createFileRoute, Link } from "@tanstack/react-router";
import { services, toneStyles } from "@/lib/site-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — E-WEST Hub" },
      {
        name: "description",
        content:
          "Bursaries, issue reporting, internships, jobs, tenders and public notices for Embakasi West residents.",
      },
      { property: "og:title", content: "Services — E-WEST Hub" },
      {
        property: "og:description",
        content: "All constituency services for Embakasi West in one place.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Constituency Services
        </span>
        <h1 className="text-4xl font-semibold mb-4">All services in one place</h1>
        <p className="text-muted-foreground text-pretty">
          Explore every service Embakasi West offers residents — from bursaries and
          issue reporting to internships and tenders.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              to={s.href}
              className="block bg-white p-6 rounded-xl ring-1 ring-black/5 hover:ring-primary/20 transition-all"
            >
              <div
                className={`size-10 flex items-center justify-center rounded-lg mb-4 ${toneStyles[s.tone]}`}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-medium mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 text-pretty">{s.blurb}</p>
              <span className="text-sm font-medium text-primary inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                {s.cta}
                <span className="text-xs">→</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}