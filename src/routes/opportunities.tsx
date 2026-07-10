import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listOpportunities } from "@/lib/dashboard.functions";
import { opportunities as fallbackOpps } from "@/lib/site-data";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — E-WEST Hub" },
      {
        name: "description",
        content:
          "Internships, jobs, attachments and tenders for residents of Embakasi West.",
      },
      { property: "og:title", content: "Opportunities — E-WEST Hub" },
      {
        property: "og:description",
        content: "Verified jobs, internships and tenders in Embakasi West.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const typeStyles: Record<string, string> = {
  Job: "bg-purple-50 text-purple-700",
  Internship: "bg-blue-50 text-blue-700",
  Attachment: "bg-emerald-50 text-primary",
  Tender: "bg-amber-50 text-amber-700",
};

function OpportunitiesPage() {
  const fetchOpps = useServerFn(listOpportunities);
  const { data } = useQuery({ queryKey: ["opportunities"], queryFn: () => fetchOpps() });
  const rows = data && data.length > 0
    ? data.map((o) => ({
        id: o.id,
        title: o.title,
        organization: o.organization,
        type: o.type as "Job" | "Internship" | "Attachment" | "Tender",
        location: o.location ?? "—",
        deadline: o.deadline ?? "—",
      }))
    : fallbackOpps;
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <header className="mb-12 max-w-2xl">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-primary text-[11px] font-semibold uppercase tracking-wider mb-4">
          Jobs & Internships
        </span>
        <h1 className="text-4xl font-semibold mb-4">Opportunities Board</h1>
        <p className="text-muted-foreground text-pretty">
          Local jobs, internships, attachments and open tenders — updated as they are posted by the constituency office.
        </p>
      </header>

      <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border overflow-hidden">
        {rows.map((op) => (
          <div
            key={op.id}
            className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${typeStyles[op.type]}`}
                >
                  {op.type}
                </span>
                <span className="text-xs text-muted-foreground">{op.location}</span>
              </div>
              <h3 className="font-medium">{op.title}</h3>
              <p className="text-sm text-muted-foreground">{op.organization}</p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Deadline
              </div>
              <div className="text-sm font-medium">{op.deadline}</div>
            </div>
            <button className="text-sm font-medium text-primary underline underline-offset-4 md:ml-4">
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}