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

type Tab = "overview" | "news" | "projects" | "opportunities" | "reports" | "bursaries";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const getData = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getData(),
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "news", label: "News" },
    { id: "projects", label: "Projects" },
    { id: "opportunities", label: "Opportunities" },
    { id: "reports", label: "Issue Reports" },
    { id: "bursaries", label: "Bursaries" },
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
          {tab === "news" && <NewsPanel rows={data.news} />}
          {tab === "projects" && <ProjectsPanel rows={data.projects} />}
          {tab === "opportunities" && <OpportunitiesPanel rows={data.opportunities} />}
          {tab === "reports" && <ReportsPanel rows={data.reports} />}
          {tab === "bursaries" && <BursariesPanel rows={data.bursaries} />}
        </>
      )}
    </div>
  );
}

function Overview({ data }: { data: Awaited<ReturnType<typeof getAdminDashboard>> }) {
  const stats = [
    { label: "News items", value: data.news.length },
    { label: "Projects", value: data.projects.length },
    { label: "Opportunities", value: data.opportunities.length },
    { label: "Open reports", value: data.reports.filter((r) => r.status === "pending" || r.status === "in_progress").length },
    { label: "Pending bursaries", value: data.bursaries.filter((b) => b.status === "pending").length },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
    mutationFn: (d: Parameters<typeof upsert>[0]["data"]) => upsert({ data: d }),
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
    mutationFn: (d: Parameters<typeof upsert>[0]["data"]) => upsert({ data: d }),
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
    mutationFn: (d: Parameters<typeof upsert>[0]["data"]) => upsert({ data: d }),
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

function ReportsPanel({ rows }: { rows: Array<{ id: string; title: string; category: string; status: string; ward: string | null; admin_notes: string | null; created_at: string; profiles: { full_name: string | null; phone: string | null; ward: string | null } | null }> }) {
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
              {r.category} • {r.profiles?.full_name ?? "Unknown"}{r.profiles?.phone ? ` • ${r.profiles.phone}` : ""}{r.ward ? ` • ${r.ward}` : ""}
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

function BursariesPanel({ rows }: { rows: Array<{ id: string; student_name: string; school: string; level: string; amount_requested: number; status: string; admin_notes: string | null; profiles: { full_name: string | null; phone: string | null } | null }> }) {
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
        <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{b.student_name}</p>
            <p className="text-xs text-muted-foreground">
              {b.school} • {b.level} • KES {b.amount_requested.toLocaleString()} • Guardian: {b.profiles?.full_name ?? "Unknown"}
            </p>
          </div>
          <Select
            defaultValue={b.status}
            onChange={(e) => m.mutate({ id: b.id, status: e.target.value, admin_notes: b.admin_notes ?? undefined })}
            style={{ maxWidth: 160 }}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disbursed">Disbursed</option>
          </Select>
        </div>
      ))}
    </div>
  );
}