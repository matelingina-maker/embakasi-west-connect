import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getAdminDashboard,
  upsertNews,
  deleteNews,
  upsertProject,
  deleteProject,
  upsertOpportunity,
  deleteOpportunity,
  updateReportStatus,
  updateBursaryStatus,
  reviewResidency,
  upsertFacility,
  deleteFacility,
  updateOpportunityAppStatus,
  getSignedDocUrl,
  upsertAnnouncement,
  deleteAnnouncement,
} from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — E-WEST Hub" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

type Tab = "overview" | "announcements" | "verifications" | "news" | "projects" | "opportunities" | "reports" | "bursaries" | "applications" | "facilities" | "activity";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const getData = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getData(),
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "announcements", label: "Breaking News" },
    { id: "verifications", label: "Verifications" },
    { id: "news", label: "News" },
    { id: "projects", label: "Projects" },
    { id: "opportunities", label: "Opportunities" },
    { id: "applications", label: "Job Applications" },
    { id: "reports", label: "Issue Reports" },
    { id: "bursaries", label: "Bursaries" },
    { id: "facilities", label: "Facilities" },
    { id: "activity", label: "Users & Activity" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold">Admin</span>
        <h1 className="text-3xl font-semibold">Constituency Console</h1>
        <p className="text-sm text-muted-foreground">Manage content and resident submissions.</p>
      </div>

      <nav className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data && (
        <>
          {tab === "overview" && <Overview data={data} />}
          {tab === "announcements" && <AnnouncementsPanel rows={data.announcements ?? []} />}
          {tab === "verifications" && <VerificationsPanel rows={data.pendingResidents} />}
          {tab === "news" && <NewsPanel rows={data.news} />}
          {tab === "projects" && <ProjectsPanel rows={data.projects} />}
          {tab === "opportunities" && <OpportunitiesPanel rows={data.opportunities} />}
          {tab === "applications" && <AppsPanel rows={data.oppApps} />}
          {tab === "reports" && <ReportsPanel rows={data.reports} />}
          {tab === "bursaries" && <BursariesPanel rows={data.bursaries} />}
          {tab === "facilities" && <FacilitiesPanel rows={data.facilities} />}
          {tab === "activity" && <ActivityPanel data={data} />}
        </>
      )}
    </div>
  );
}

function Overview({ data }: { data: Awaited<ReturnType<typeof getAdminDashboard>> }) {
  const stats = [
    { label: "Active users (30d)", value: data.activeUserCount },
    { label: "Pending verifications", value: data.pendingResidents.length },
    { label: "News items", value: data.news.length },
    { label: "Projects", value: data.projects.length },
    { label: "Opportunities", value: data.opportunities.length },
    { label: "Open reports", value: data.reports.filter((r) => r.status === "pending" || r.status === "in_progress").length },
    { label: "Pending bursaries", value: data.bursaries.filter((b) => b.status === "pending").length },
    { label: "Facilities tracked", value: data.facilities.length },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white p-5 rounded-xl ring-1 ring-black/5">
          <p className="text-3xl font-semibold">{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function Panel({ children, title, form }: { title: string; children: React.ReactNode; form: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <h2 className="text-lg font-medium mb-3">{title}</h2>
        <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">{children}</div>
      </div>
      <aside className="bg-white p-5 rounded-xl ring-1 ring-black/5 self-start">
        <h3 className="text-sm font-semibold mb-3">Add new</h3>
        {form}
      </aside>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full h-9 px-3 rounded-md ring-1 ring-border bg-white text-sm" />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full px-3 py-2 rounded-md ring-1 ring-border bg-white text-sm" />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full h-9 px-3 rounded-md ring-1 ring-border bg-white text-sm" />;
}
function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button disabled={pending} className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}

function NewsPanel({ rows }: { rows: Array<{ id: string; title: string; summary: string; tag: string | null; published: boolean }> }) {
  const upsert = useServerFn(upsertNews);
  const del = useServerFn(deleteNews);
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (d: { title: string; summary: string; tag: string | null; published: boolean }) =>
      upsert({ data: d }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-dashboard"] }),
  });
  return (
    <Panel
      title="News & Notices"
      form={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add.mutate({
              title: fd.get("title") as string,
              summary: fd.get("summary") as string,
              tag: (fd.get("tag") as string) || null,
              published: true,
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
          className="space-y-2"
        >
          <Input name="title" required placeholder="Title" />
          <Textarea name="summary" required placeholder="Summary" rows={3} />
          <Input name="tag" placeholder="Tag (Health, Youth…)" />
          <Submit pending={add.isPending} label="Publish" />
        </form>
      }
    >
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No news yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{r.summary}</p>
          </div>
          <button onClick={() => remove.mutate(r.id)} className="text-sm text-red-600">Delete</button>
        </div>
      ))}
    </Panel>
  );
}

function ProjectsPanel({ rows }: { rows: Array<{ id: string; title: string; ward: string; status: string; progress: number }> }) {
  const upsert = useServerFn(upsertProject);
  const del = useServerFn(deleteProject);
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (d: {
      title: string;
      description: string;
      ward: string;
      category: string;
      status: "Planning" | "Active" | "Completed";
      progress: number;
      published: boolean;
    }) => upsert({ data: d }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-dashboard"] }),
  });
  return (
    <Panel
      title="Projects"
      form={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add.mutate({
              title: fd.get("title") as string,
              description: fd.get("description") as string,
              ward: fd.get("ward") as string,
              category: fd.get("category") as string,
              status: fd.get("status") as "Planning" | "Active" | "Completed",
              progress: Number(fd.get("progress")),
              published: true,
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
          className="space-y-2"
        >
          <Input name="title" required placeholder="Title" />
          <Textarea name="description" required placeholder="Description" rows={2} />
          <Input name="ward" required placeholder="Ward" />
          <Input name="category" required placeholder="Category" />
          <Select name="status" defaultValue="Active">
            <option>Planning</option>
            <option>Active</option>
            <option>Completed</option>
          </Select>
          <Input name="progress" type="number" min={0} max={100} defaultValue={0} required />
          <Submit pending={add.isPending} label="Add project" />
        </form>
      }
    >
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No projects yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.ward} • {r.status} • {r.progress}%</p>
          </div>
          <button onClick={() => remove.mutate(r.id)} className="text-sm text-red-600">Delete</button>
        </div>
      ))}
    </Panel>
  );
}

function OpportunitiesPanel({ rows }: { rows: Array<{ id: string; title: string; organization: string; type: string; deadline: string | null }> }) {
  const upsert = useServerFn(upsertOpportunity);
  const del = useServerFn(deleteOpportunity);
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (d: {
      title: string;
      organization: string;
      type: "Job" | "Internship" | "Attachment" | "Tender";
      location: string | null;
      deadline: string | null;
      apply_url: string | null;
      published: boolean;
    }) => upsert({ data: d }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-dashboard"] }),
  });
  return (
    <Panel
      title="Opportunities"
      form={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add.mutate({
              title: fd.get("title") as string,
              organization: fd.get("organization") as string,
              type: fd.get("type") as "Job" | "Internship" | "Attachment" | "Tender",
              location: (fd.get("location") as string) || null,
              deadline: (fd.get("deadline") as string) || null,
              apply_url: (fd.get("apply_url") as string) || null,
              published: true,
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
          className="space-y-2"
        >
          <Input name="title" required placeholder="Title" />
          <Input name="organization" required placeholder="Organization" />
          <Select name="type" defaultValue="Job">
            <option>Job</option>
            <option>Internship</option>
            <option>Attachment</option>
            <option>Tender</option>
          </Select>
          <Input name="location" placeholder="Location" />
          <Input name="deadline" type="date" />
          <Input name="apply_url" placeholder="Apply URL" />
          <Submit pending={add.isPending} label="Add" />
        </form>
      }
    >
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nothing posted yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.organization} • {r.type}{r.deadline ? ` • ${r.deadline}` : ""}</p>
          </div>
          <button onClick={() => remove.mutate(r.id)} className="text-sm text-red-600">Delete</button>
        </div>
      ))}
    </Panel>
  );
}

function ReportsPanel({ rows }: { rows: Array<{ id: string; title: string; category: string; status: string; ward: string | null; admin_notes: string | null; created_at: string; profile: { full_name: string | null; phone: string | null; ward: string | null } | null }> }) {
  const update = useServerFn(updateReportStatus);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (d: { id: string; status: string; admin_notes?: string }) => update({ data: d }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No reports yet.</p>}
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground">
              {r.category} • {r.profile?.full_name ?? "Unknown"}{r.profile?.phone ? ` • ${r.profile.phone}` : ""}{r.ward ? ` • ${r.ward}` : ""}
            </p>
          </div>
          <Select
            defaultValue={r.status}
            onChange={(e) => m.mutate({ id: r.id, status: e.target.value, admin_notes: r.admin_notes ?? undefined })}
            style={{ maxWidth: 160 }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      ))}
    </div>
  );
}

function BursariesPanel({ rows }: { rows: Array<{ id: string; student_name: string; school: string; level: string; amount_requested: number; status: string; admin_notes: string | null; profile: { full_name: string | null; phone: string | null; ward: string | null } | null }> }) {
  const update = useServerFn(updateBursaryStatus);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (d: { id: string; status: string; admin_notes?: string }) => update({ data: d }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No applications yet.</p>}
      {rows.map((b) => (
        <BursaryRow key={b.id} b={b} onChange={(status) => m.mutate({ id: b.id, status, admin_notes: b.admin_notes ?? undefined })} />
      ))}
    </div>
  );
}

function BursaryRow({ b, onChange }: { b: { id: string; student_name: string; school: string; level: string; amount_requested: number; status: string; result_slip_path?: string | null; fee_structure_path?: string | null; school_receipt_path?: string | null; profile: { full_name: string | null; phone: string | null; ward: string | null } | null }; onChange: (s: string) => void }) {
  const docs = [
    { label: "Result slip", path: b.result_slip_path },
    { label: "Fee structure", path: b.fee_structure_path },
    { label: "Receipt", path: b.school_receipt_path },
  ].filter((d): d is { label: string; path: string } => !!d.path);
  return (
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{b.student_name}</p>
            <p className="text-xs text-muted-foreground">
              {b.school} • {b.level} • KES {b.amount_requested.toLocaleString()} • Guardian: {b.profile?.full_name ?? "Unknown"}
            </p>
            {docs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {docs.map((d) => (
                  <DocLink key={d.label} bucket="bursary-docs" path={d.path} label={d.label} />
                ))}
              </div>
            )}
          </div>
          <Select
            defaultValue={b.status}
            onChange={(e) => onChange(e.target.value)}
            style={{ maxWidth: 160 }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disbursed">Disbursed</option>
          </Select>
        </div>
  );
}

function DocLink({ bucket, path, label }: { bucket: "bursary-docs" | "opportunity-docs" | "issue-photos"; path: string; label: string }) {
  const sign = useServerFn(getSignedDocUrl);
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          setLoading(true);
          const { url } = await sign({ data: { bucket, path } });
          window.open(url, "_blank");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        } finally { setLoading(false); }
      }}
      className="text-xs font-medium text-primary underline decoration-primary/40 underline-offset-2"
    >
      {loading ? "Opening…" : `📄 ${label}`}
    </button>
  );
}

function VerificationsPanel({ rows }: { rows: Array<{ id: string; full_name: string | null; phone: string | null; ward: string | null; national_id: string | null; residency_status: string; residency_submitted_at: string | null }> }) {
  const review = useServerFn(reviewResidency);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (d: { user_id: string; status: "verified" | "rejected"; reason?: string }) => review({ data: d }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No pending residency verifications.</p>}
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{r.full_name ?? "(no name)"}</p>
            <p className="text-xs text-muted-foreground">
              ID {r.national_id ?? "?"} • {r.phone ?? "?"} • {r.ward ?? "?"} • status: {r.residency_status}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => m.mutate({ user_id: r.id, status: "verified" })}
              className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >Approve</button>
            <button
              onClick={() => {
                const reason = window.prompt("Reason for rejection?") ?? undefined;
                m.mutate({ user_id: r.id, status: "rejected", reason });
              }}
              className="h-9 px-3 rounded-md ring-1 ring-red-300 text-red-700 text-sm font-medium"
            >Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AppsPanel({ rows }: { rows: Array<{ id: string; applicant_name: string; phone: string | null; status: string; cv_path: string | null; additional_doc_path: string | null; opportunities: { title: string; type: string; organization: string } | null; profile: { full_name: string | null; phone: string | null; ward: string | null } | null }> }) {
  const update = useServerFn(updateOpportunityAppStatus);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (d: { id: string; status: string }) => update({ data: d }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No applications yet.</p>}
      {rows.map((a) => (
        <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{a.applicant_name} → {a.opportunities?.title ?? "Opportunity"}</p>
            <p className="text-xs text-muted-foreground">
              {a.opportunities?.organization} • {a.opportunities?.type} • {a.phone ?? a.profile?.phone ?? "no phone"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {a.cv_path && <DocLink bucket="opportunity-docs" path={a.cv_path} label="CV" />}
              {a.additional_doc_path && <DocLink bucket="opportunity-docs" path={a.additional_doc_path} label="Extra doc" />}
            </div>
          </div>
          <Select
            defaultValue={a.status}
            onChange={(e) => m.mutate({ id: a.id, status: e.target.value })}
            style={{ maxWidth: 160 }}
          >
            <option value="submitted">Submitted</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      ))}
    </div>
  );
}

function FacilitiesPanel({ rows }: { rows: Array<{ id: string; name: string; category: string; ward: string; location: string | null; assessment_score: number | null; last_assessed: string | null }> }) {
  const upsert = useServerFn(upsertFacility);
  const del = useServerFn(deleteFacility);
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (d: { name: string; category: string; ward: string; location: string | null; assessment_score: number | null; assessment_notes: string | null; last_assessed: string | null }) => upsert({ data: d }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-dashboard"] }),
  });
  return (
    <Panel
      title="Schools, hospitals & services — assessments"
      form={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            add.mutate({
              name: fd.get("name") as string,
              category: fd.get("category") as string,
              ward: fd.get("ward") as string,
              location: (fd.get("location") as string) || null,
              assessment_score: fd.get("assessment_score") ? Number(fd.get("assessment_score")) : null,
              assessment_notes: (fd.get("assessment_notes") as string) || null,
              last_assessed: (fd.get("last_assessed") as string) || null,
            });
            (e.currentTarget as HTMLFormElement).reset();
          }}
          className="space-y-2"
        >
          <Input name="name" required placeholder="Facility name" />
          <Select name="category" defaultValue="School">
            <option>School</option>
            <option>Hospital</option>
            <option>Health Centre</option>
            <option>Market</option>
            <option>Water</option>
            <option>Roads</option>
            <option>Other</option>
          </Select>
          <Input name="ward" required placeholder="Ward" />
          <Input name="location" placeholder="Location" />
          <Input name="assessment_score" type="number" min={0} max={100} placeholder="Score 0-100" />
          <Input name="last_assessed" type="date" />
          <Textarea name="assessment_notes" rows={2} placeholder="Assessment notes" />
          <Submit pending={add.isPending} label="Save facility" />
        </form>
      }
    >
      {rows.length === 0 && <p className="p-6 text-sm text-muted-foreground">No facilities tracked yet.</p>}
      {rows.map((f) => (
        <div key={f.id} className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{f.name} <span className="text-xs text-muted-foreground">• {f.category}</span></p>
            <p className="text-xs text-muted-foreground">{f.ward} {f.location ? `• ${f.location}` : ""}</p>
            {typeof f.assessment_score === "number" && (
              <div className="mt-1 w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${f.assessment_score}%` }} />
              </div>
            )}
          </div>
          <button onClick={() => remove.mutate(f.id)} className="text-sm text-red-600">Delete</button>
        </div>
      ))}
    </Panel>
  );
}

function ActivityPanel({ data }: { data: Awaited<ReturnType<typeof getAdminDashboard>> }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-medium mb-3">Top contributors</h3>
        {data.topContributors.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        <ol className="space-y-2">
          {data.topContributors.map((c, i) => (
            <li key={c.user_id} className="flex items-center justify-between text-sm">
              <span>{i + 1}. {c.profile?.full_name ?? c.user_id.slice(0, 8)} <span className="text-muted-foreground text-xs">• {c.profile?.ward ?? "?"}</span></span>
              <span className="font-semibold">{c.contributions}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5">
        <h3 className="font-medium mb-3">Recent activity</h3>
        <ul className="divide-y divide-border max-h-[520px] overflow-auto">
          {data.activity.slice(0, 60).map((a) => (
            <li key={a.id} className="py-2 text-sm">
              <p className="font-medium">{a.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">
                {a.profile?.full_name ?? a.user_id.slice(0, 8)} • {new Date(a.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type Announcement = { id: string; message: string; cta_label: string | null; cta_href: string | null; active: boolean; updated_at: string };

function AnnouncementsPanel({ rows }: { rows: Announcement[] }) {
  const upsert = useServerFn(upsertAnnouncement);
  const del = useServerFn(deleteAnnouncement);
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["active-announcement"] });
  };
  const create = useMutation({
    mutationFn: (d: { message: string; cta_label: string | null; cta_href: string | null; active: boolean }) => upsert({ data: d }),
    onSuccess: () => { toast.success("Announcement saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          create.mutate({
            message: fd.get("message") as string,
            cta_label: (fd.get("cta_label") as string) || null,
            cta_href: (fd.get("cta_href") as string) || null,
            active: fd.get("active") === "on",
          });
          (e.currentTarget as HTMLFormElement).reset();
        }}
        className="bg-white p-6 rounded-xl ring-1 ring-black/5 space-y-3 max-w-2xl"
      >
        <h3 className="font-medium">Post a breaking news banner</h3>
        <p className="text-xs text-muted-foreground">Shown at the top of every page. Set inactive to hide.</p>
        <textarea name="message" required rows={2} placeholder="Message" className="w-full px-3 py-2 rounded-md ring-1 ring-border text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input name="cta_label" placeholder="Button label (optional)" className="h-10 px-3 rounded-md ring-1 ring-border text-sm" />
          <input name="cta_href" placeholder="Button link (e.g. /services)" className="h-10 px-3 rounded-md ring-1 ring-border text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked /> Active (show on site)
        </label>
        <button className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium">Save announcement</button>
      </form>

      <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
        {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No announcements yet.</p>}
        {rows.map((a) => (
          <div key={a.id} className="p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{a.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {a.active ? "🟢 Active" : "⚪ Inactive"} • updated {new Date(a.updated_at).toLocaleString()}
                {a.cta_label ? ` • CTA: ${a.cta_label} → ${a.cta_href}` : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => create.mutate({ message: a.message, cta_label: a.cta_label, cta_href: a.cta_href, active: !a.active })}
                className="h-8 px-3 text-xs rounded ring-1 ring-border"
              >
                {a.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => remove.mutate(a.id)}
                className="h-8 px-3 text-xs rounded ring-1 ring-border text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}