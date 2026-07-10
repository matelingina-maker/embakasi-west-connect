import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/dashboard.functions";
import { projects as fallbackProjects } from "@/lib/site-data";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Ongoing Projects — E-WEST Hub" },
      {
        name: "description",
        content:
          "Track NG-CDF funded infrastructure, health, education and security projects across Embakasi West.",
      },
      { property: "og:title", content: "Ongoing Projects — E-WEST Hub" },
      {
        property: "og:description",
        content: "Live progress on constituency development projects in Embakasi West.",
      },
    ],
  }),
  component: ProjectsPage,
});

const statusStyles: Record<string, string> = {
  Active: "text-emerald-700 bg-emerald-50",
  Completed: "text-blue-700 bg-blue-50",
  Planning: "text-amber-700 bg-amber-50",
};

function ProjectsPage() {
  const fetchProjects = useServerFn(listProjects);
  const { data } = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const rows = data && data.length > 0
    ? data.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        ward: p.ward,
        status: p.status as "Active" | "Planning" | "Completed",
        progress: p.progress,
        category: p.category,
        image: p.image_url ?? fallbackProjects[0].image,
      }))
    : fallbackProjects;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Transparency
        </span>
        <h1 className="text-4xl font-semibold mb-4">Ongoing Projects</h1>
        <p className="text-muted-foreground text-pretty">
          Every NG-CDF-funded development in Embakasi West, with live status and completion percentages.
        </p>
      </header>

      <div className="space-y-4">
        {rows.map((p) => (
          <article
            key={p.id}
            className="p-4 md:p-6 rounded-xl ring-1 ring-black/5 flex flex-col md:flex-row gap-6 items-center bg-white"
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
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusStyles[p.status]}`}
                >
                  {p.status}
                </span>
                <span className="text-xs text-muted-foreground">{p.ward}</span>
                <span className="text-zinc-300">•</span>
                <span className="text-xs text-muted-foreground">{p.category}</span>
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
          </article>
        ))}
      </div>
    </div>
  );
}