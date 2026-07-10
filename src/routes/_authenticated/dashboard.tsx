import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getMyDashboard,
  updateMyProfile,
  submitReport,
  submitBursary,
  toggleSavedOpportunity,
} from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — E-WEST Hub" }] }),
  component: Dashboard,
});

type Tab = "overview" | "profile" | "report" | "bursary" | "saved";

function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const getData = useServerFn(getMyDashboard);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: () => getData(),
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "report", label: "Report Issue" },
    { id: "bursary", label: "Bursary" },
    { id: "saved", label: "Saved" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data?.profile?.full_name ?? "Welcome"} — {data?.profile?.ward ?? "Set your ward in profile"}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="h-9 px-3 rounded-md text-sm ring-1 ring-border hover:bg-muted transition-colors self-start"
        >
          Sign out
        </button>
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
          {tab === "profile" && <ProfileForm profile={data.profile} />}
          {tab === "report" && <ReportForm />}
          {tab === "bursary" && <BursaryForm />}
          {tab === "saved" && <SavedList saved={data.saved} />}
        </>
      )}
    </div>
  );
}

function Overview({ data }: { data: NonNullable<Awaited<ReturnType<typeof getMyDashboard>>> }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="My Reports" empty="No reports yet">
        {data.reports.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-none border-border">
            <div>
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.category}</p>
            </div>
            <StatusPill value={r.status} />
          </div>
        ))}
      </Card>
      <Card title="My Bursary Applications" empty="No applications yet">
        {data.bursaries.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-none border-border">
            <div>
              <p className="text-sm font-medium">{b.student_name}</p>
              <p className="text-xs text-muted-foreground">
                {b.school} — KES {b.amount_requested.toLocaleString()}
              </p>
            </div>
            <StatusPill value={b.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function Card({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="bg-white p-6 rounded-xl ring-1 ring-black/5">
      <h3 className="font-medium mb-4">{title}</h3>
      {hasChildren ? <div>{children}</div> : <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    in_progress: "bg-blue-50 text-blue-700",
    resolved: "bg-emerald-50 text-primary",
    rejected: "bg-red-50 text-red-700",
    approved: "bg-emerald-50 text-primary",
    disbursed: "bg-emerald-100 text-primary",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${map[value] ?? "bg-zinc-100 text-zinc-700"}`}>
      {value.replace("_", " ")}
    </span>
  );
}

function ProfileForm({ profile }: { profile: { full_name: string | null; phone: string | null; ward: string | null; national_id: string | null } | null }) {
  const update = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (data: Parameters<typeof update>[0]["data"]) => update({ data }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        m.mutate({
          full_name: fd.get("full_name") as string,
          phone: fd.get("phone") as string,
          ward: fd.get("ward") as string,
          national_id: fd.get("national_id") as string,
        });
      }}
      className="bg-white p-6 rounded-xl ring-1 ring-black/5 max-w-lg space-y-3"
    >
      <Field label="Full name" name="full_name" defaultValue={profile?.full_name ?? ""} />
      <Field label="Phone" name="phone" defaultValue={profile?.phone ?? ""} />
      <Field label="Ward / estate" name="ward" defaultValue={profile?.ward ?? ""} placeholder="Umoja II, Mowlem…" />
      <Field label="National ID" name="national_id" defaultValue={profile?.national_id ?? ""} />
      <button disabled={m.isPending} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {m.isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", required = false, textarea = false }: { label: string; name: string; defaultValue?: string; placeholder?: string; type?: string; required?: boolean; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} rows={4} className="mt-1 w-full px-3 py-2 rounded-md ring-1 ring-border bg-white text-sm" />
      ) : (
        <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="mt-1 w-full h-10 px-3 rounded-md ring-1 ring-border bg-white text-sm" />
      )}
    </label>
  );
}

function ReportForm() {
  const submit = useServerFn(submitReport);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (data: Parameters<typeof submit>[0]["data"]) => submit({ data }),
    onSuccess: () => {
      toast.success("Report submitted. We will follow up.");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        m.mutate({
          title: fd.get("title") as string,
          category: fd.get("category") as string,
          description: fd.get("description") as string,
          location: (fd.get("location") as string) || null,
          ward: (fd.get("ward") as string) || null,
        });
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="bg-white p-6 rounded-xl ring-1 ring-black/5 max-w-lg space-y-3"
    >
      <Field label="Title" name="title" required placeholder="Broken streetlight on Mowlem Road" />
      <Field label="Category" name="category" required placeholder="Roads, Drainage, Streetlight, Security…" />
      <Field label="Location" name="location" placeholder="Nearest landmark" />
      <Field label="Ward" name="ward" placeholder="Umoja II" />
      <Field label="Description" name="description" required textarea />
      <button disabled={m.isPending} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {m.isPending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}

function BursaryForm() {
  const submit = useServerFn(submitBursary);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (data: Parameters<typeof submit>[0]["data"]) => submit({ data }),
    onSuccess: () => {
      toast.success("Bursary application submitted");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        m.mutate({
          student_name: fd.get("student_name") as string,
          school: fd.get("school") as string,
          level: fd.get("level") as string,
          amount_requested: Number(fd.get("amount_requested")),
          reason: (fd.get("reason") as string) || null,
        });
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="bg-white p-6 rounded-xl ring-1 ring-black/5 max-w-lg space-y-3"
    >
      <Field label="Student name" name="student_name" required />
      <Field label="School" name="school" required />
      <Field label="Level" name="level" required placeholder="Secondary / Tertiary" />
      <Field label="Amount requested (KES)" name="amount_requested" type="number" required />
      <Field label="Reason" name="reason" textarea />
      <button disabled={m.isPending} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {m.isPending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function SavedList({ saved }: { saved: Array<{ opportunity_id: string; opportunities: { id: string; title: string; organization: string; type: string; deadline: string | null } | null }> }) {
  const toggle = useServerFn(toggleSavedOpportunity);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (id: string) => toggle({ data: { opportunity_id: id, save: false } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-dashboard"] }),
  });
  if (saved.length === 0)
    return <p className="text-sm text-muted-foreground">No saved opportunities yet. Browse the Opportunities page.</p>;
  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 divide-y divide-border">
      {saved.map((s) =>
        s.opportunities ? (
          <div key={s.opportunity_id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{s.opportunities.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.opportunities.organization} — {s.opportunities.type}
                {s.opportunities.deadline ? ` • deadline ${s.opportunities.deadline}` : ""}
              </p>
            </div>
            <button
              onClick={() => m.mutate(s.opportunity_id)}
              className="text-sm text-red-600 font-medium"
            >
              Remove
            </button>
          </div>
        ) : null,
      )}
    </div>
  );
}