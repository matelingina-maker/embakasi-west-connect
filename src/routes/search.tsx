import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { searchContent } from "@/lib/dashboard.functions";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — E-WEST Hub" }] }),
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const search = useServerFn(searchContent);
  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => search({ data: { q } }),
    enabled: q.length > 0,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <h1 className="text-3xl font-semibold mb-6">Search</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q") as string;
          navigate({ search: { q: value } });
        }}
        className="flex gap-2 mb-8"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search news, projects, opportunities…"
          className="flex-1 h-11 px-4 rounded-md ring-1 ring-border bg-white text-sm"
        />
        <button className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          Search
        </button>
      </form>

      {!q && <p className="text-muted-foreground">Type a query above to search across the site.</p>}
      {q && isFetching && <p className="text-muted-foreground">Searching…</p>}

      {data && (
        <div className="space-y-10">
          <Section title="News" empty={data.news.length === 0}>
            {data.news.map((n) => (
              <Link to="/news" key={n.id} className="block py-3 border-b border-border last:border-none hover:text-primary">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{n.summary}</p>
              </Link>
            ))}
          </Section>
          <Section title="Projects" empty={data.projects.length === 0}>
            {data.projects.map((p) => (
              <Link to="/projects" key={p.id} className="block py-3 border-b border-border last:border-none hover:text-primary">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.ward} • {p.status} • {p.progress}%</p>
              </Link>
            ))}
          </Section>
          <Section title="Opportunities" empty={data.opportunities.length === 0}>
            {data.opportunities.map((o) => (
              <Link to="/opportunities" key={o.id} className="block py-3 border-b border-border last:border-none hover:text-primary">
                <p className="font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.organization} • {o.type}{o.deadline ? ` • ${o.deadline}` : ""}</p>
              </Link>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      {empty ? <p className="text-sm text-muted-foreground">No matches.</p> : <div>{children}</div>}
    </div>
  );
}