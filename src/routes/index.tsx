import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-embakasi.jpg";
import { services, toneStyles, projects, news } from "@/lib/site-data";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const featured = projects.slice(0, 2);
  return (
    <>
      {/* Hero */}
      <header className="bg-white border-b border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-[640px]">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-6">
              Official Constituency Portal
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-balance mb-6">
              Digital Services for the People of Embakasi West
            </h1>
            <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-[48ch]">
              Access CDF bursaries, report infrastructure issues, and track ongoing
              development projects across Umoja, Mowlem, Kariobangi South and Mountain View.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/services"
                className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium ring-1 ring-primary inline-flex items-center gap-2 hover:brightness-110 transition-all"
              >
                Access All Services
              </Link>
              <Link
                to="/opportunities"
                className="h-10 px-5 rounded-md bg-white text-foreground text-sm font-medium ring-1 ring-border inline-flex items-center gap-2 hover:bg-muted transition-colors"
              >
                View Opportunities
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Aerial view of Embakasi West neighborhood at golden hour"
              width={1600}
              height={1000}
              className="w-full aspect-[4/3] object-cover rounded-2xl ring-1 ring-black/5 shadow-xl shadow-black/5"
            />
          </div>
        </div>
      </header>

      {/* Services */}
      <section className="py-16 md:py-24 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-2">Constituency Services</h2>
            <p className="text-muted-foreground text-sm text-pretty max-w-[56ch]">
              Direct access to essential government programs and public utilities at the local level.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.slug}
                  to="/services"
                  className="group bg-white p-6 rounded-xl ring-1 ring-black/5 hover:ring-primary/20 transition-all block"
                >
                  <div
                    className={`size-10 flex items-center justify-center rounded-lg mb-4 ${toneStyles[s.tone]}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-pretty">
                    {s.blurb}
                  </p>
                  <span className="text-sm font-medium text-primary inline-flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                    {s.cta}
                    <span className="text-xs">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Projects highlight */}
      <section className="py-16 md:py-24 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Development Progress</h2>
              <p className="text-muted-foreground text-sm max-w-[56ch] text-pretty">
                Live updates on infrastructure projects across the constituency.
              </p>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-primary py-2 px-3 inline-flex items-center gap-2 hover:bg-emerald-50 rounded-md transition-colors"
            >
              View all projects →
            </Link>
          </div>

          <div className="space-y-4">
            {featured.map((p) => (
              <div
                key={p.id}
                className="p-4 md:p-6 rounded-xl ring-1 ring-black/5 flex flex-col md:flex-row gap-6 items-center"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={960}
                  height={640}
                  className="w-full md:w-48 aspect-video object-cover rounded-xl flex-shrink-0 ring-1 ring-black/5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      {p.status}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-xs text-muted-foreground">{p.ward}</span>
                  </div>
                  <h4 className="text-lg font-medium mb-1">{p.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[56ch] text-pretty">
                    {p.description}
                  </p>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-semibold">{p.progress}%</span>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    Complete
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News strip */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold">Latest Updates</h2>
            <Link to="/news" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all news
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {news.slice(0, 4).map((n) => (
              <div key={n.id} className="flex gap-4">
                <span className="text-xs font-semibold text-muted-foreground mt-1 shrink-0">
                  {n.date}
                </span>
                <div>
                  <h4 className="font-medium mb-1 hover:text-primary cursor-pointer transition-colors">
                    {n.title}
                  </h4>
                  <p className="text-sm text-muted-foreground text-pretty">{n.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
