import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFacilities } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: "Facilities & Service Assessments — E-WEST Hub" },
      { name: "description", content: "Assessments of schools, hospitals and public services across Embakasi West wards." },
    ],
  }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const fn = useServerFn(listFacilities);
  const { data = [] } = useQuery({ queryKey: ["facilities"], queryFn: () => fn() });

  const byCategory = new Map<string, typeof data>();
  for (const f of data) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f);
    byCategory.set(f.category, arr);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <span className="text-xs uppercase tracking-widest text-primary font-semibold">Service Delivery</span>
      <h1 className="text-3xl md:text-4xl font-semibold mt-1 mb-3">Facilities & Assessments</h1>
      <p className="text-muted-foreground max-w-[60ch] mb-10">
        Independent assessments of schools, health facilities and public services across Embakasi West.
      </p>

      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">Assessments will appear here as they are published.</p>
      )}

      {[...byCategory.entries()].map(([category, rows]) => (
        <section key={category} className="mb-10">
          <h2 className="text-lg font-semibold mb-4">{category}s</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rows.map((f) => (
              <div key={f.id} className="bg-white p-5 rounded-xl ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.ward}{f.location ? ` • ${f.location}` : ""}</p>
                  </div>
                  {typeof f.assessment_score === "number" && (
                    <span className="text-2xl font-semibold text-primary">{f.assessment_score}<span className="text-xs text-muted-foreground">/100</span></span>
                  )}
                </div>
                {typeof f.assessment_score === "number" && (
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary" style={{ width: `${f.assessment_score}%` }} />
                  </div>
                )}
                {f.assessment_notes && <p className="text-sm text-muted-foreground">{f.assessment_notes}</p>}
                {f.last_assessed && <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-3">Last assessed {f.last_assessed}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}