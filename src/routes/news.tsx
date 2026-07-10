import { createFileRoute } from "@tanstack/react-router";
import { news } from "@/lib/site-data";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Notices — E-WEST Hub" },
      {
        name: "description",
        content:
          "Constituency announcements, public notices, and news from Embakasi West.",
      },
      { property: "og:title", content: "News & Notices — E-WEST Hub" },
      {
        property: "og:description",
        content: "Latest announcements and public notices from Embakasi West Constituency.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <header className="mb-12">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Updates
        </span>
        <h1 className="text-4xl font-semibold mb-4">News & Public Notices</h1>
        <p className="text-muted-foreground text-pretty max-w-2xl">
          Announcements, health drives, meetings and gazette notices affecting Embakasi West residents.
        </p>
      </header>

      <div className="space-y-8">
        {news.map((n) => (
          <article
            key={n.id}
            className="flex gap-6 pb-8 border-b border-border last:border-none"
          >
            <div className="flex-none w-20 text-right">
              <div className="text-sm font-semibold">{n.date}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {n.tag}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-medium mb-2 hover:text-primary cursor-pointer transition-colors">
                {n.title}
              </h2>
              <p className="text-muted-foreground text-pretty">{n.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}