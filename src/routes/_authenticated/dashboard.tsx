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
  submitResidencyVerification,
} from "@/lib/dashboard.functions";
import { WARDS } from "@/lib/site-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — E-WEST Hub" }] }),
  component: Dashboard,
});

type Tab = "overview" | "profile" | "verify" | "report" | "bursary" | "saved";

async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

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
    { id: "verify", label: "Residency" },
    { id: "report", label: "Report Issue" },
    { id: "bursary", label: "Bursary" },
    { id: "saved", label: "Saved" },
  ];

  const status = data?.profile?.residency_status ?? "unverified";

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

      {data && status !== "verified" && (
        <div className={`mb-6 rounded-lg p-4 text-sm ring-1 ${status === "rejected" ? "bg-red-50 ring-red-200 text-red-800" : status === "pending" ? "bg-amber-50 ring-amber-200 text-amber-900" : "bg-blue-50 ring-blue-200 text-blue-900"}`}>
          <p className="font-medium">
            {status === "pending" && "Residency verification is under review — usually within 48 hours."}
            {status === "rejected" && `Residency verification was rejected. ${data?.profile?.residency_rejection_reason ?? ""}`}
            {status === "unverified" && "Only verified Embakasi West residents can apply for bursaries, jobs, or file reports."}
          </p>
          {status !== "pending" && (
            <button onClick={() => setTab("verify")} className="mt-2 text-xs font-semibold underline">
              {status === "rejected" ? "Resubmit for review" : "Submit residency verification"}
            </button>
          )}
        </div>
      )}

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
          {tab === "verify" && <ResidencyForm profile={data.profile} />}
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
      <Card title="My Job / Internship Applications" empty="No applications yet">
        {data.oppApps.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-none border-border">
            <div>
              <p className="text-sm font-medium">{a.opportunities?.title ?? "Opportunity"}</p>
              <p className="text-xs text-muted-foreground">{a.opportunities?.organization} • {a.opportunities?.type}</p>
            </div>
            <StatusPill value={a.status} />
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
    mutationFn: (data: { full_name: string; phone: string; ward: string; national_id: string }) =>
      update({ data }),
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
      <WardSelect label="Ward" defaultValue={profile?.ward ?? ""} />
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
  const [uploading, setUploading] = useState(false);
  const m = useMutation({
    mutationFn: (data: {
      title: string;
      category: string;
      description: string;
      location: string | null;
      ward: string | null;
      photo_path: string | null;
    }) => submit({ data }),
    onSuccess: () => {
      toast.success("Report submitted. We will follow up.");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        try {
          const photo = fd.get("photo") as File | null;
          let photoPath: string | null = null;
          if (photo && photo.size > 0) {
            setUploading(true);
            photoPath = await uploadToBucket("issue-photos", photo);
          }
          await m.mutateAsync({
            title: fd.get("title") as string,
            category: fd.get("category") as string,
            description: fd.get("description") as string,
            location: (fd.get("location") as string) || null,
            ward: (fd.get("ward") as string) || null,
            photo_path: photoPath,
          });
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed");
        } finally {
          setUploading(false);
        }
      }}
      className="bg-white p-6 rounded-xl ring-1 ring-black/5 max-w-lg space-y-3"
    >
      <Field label="Title" name="title" required placeholder="Broken streetlight on Mowlem Road" />
      <Field label="Category" name="category" required placeholder="Roads, Drainage, Streetlight, Security…" />
      <Field label="Location" name="location" placeholder="Nearest landmark" />
      <WardSelect label="Ward" />
      <Field label="Description" name="description" required textarea />
      <FileField label="📷 Photo of the issue (optional — opens camera on mobile)" name="photo" accept="image/*" capture="environment" />
      <button disabled={m.isPending || uploading} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {uploading ? "Uploading…" : m.isPending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}

function BursaryForm() {
  const submit = useServerFn(submitBursary);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const m = useMutation({
    mutationFn: (data: {
      student_name: string;
      school: string;
      level: string;
      amount_requested: number;
      reason: string | null;
      result_slip_path: string | null;
      fee_structure_path: string | null;
      school_receipt_path: string | null;
    }) => submit({ data }),
    onSuccess: () => {
      toast.success("Bursary application submitted");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        try {
          setUploading(true);
          const resultSlip = fd.get("result_slip") as File;
          const feeStructure = fd.get("fee_structure") as File;
          const receipt = fd.get("school_receipt") as File;
          if (!resultSlip?.size || !feeStructure?.size) {
            toast.error("Result slip and fee structure are required");
            return;
          }
          const [rs, fs, sr] = await Promise.all([
            uploadToBucket("bursary-docs", resultSlip),
            uploadToBucket("bursary-docs", feeStructure),
            receipt?.size ? uploadToBucket("bursary-docs", receipt) : Promise.resolve<string | null>(null),
          ]);
          await m.mutateAsync({
            student_name: fd.get("student_name") as string,
            school: fd.get("school") as string,
            level: fd.get("level") as string,
            amount_requested: Number(fd.get("amount_requested")),
            reason: (fd.get("reason") as string) || null,
            result_slip_path: rs,
            fee_structure_path: fs,
            school_receipt_path: sr,
          });
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setUploading(false);
        }
      }}
      className="bg-white p-6 rounded-xl ring-1 ring-black/5 max-w-lg space-y-3"
    >
      <Field label="Student name" name="student_name" required />
      <Field label="School" name="school" required />
      <Field label="Level" name="level" required placeholder="Secondary / Tertiary" />
      <Field label="Amount requested (KES)" name="amount_requested" type="number" required />
      <Field label="Reason" name="reason" textarea />
      <FileField label="Result slip (required)" name="result_slip" accept="image/*,application/pdf" required />
      <FileField label="Fee structure (required)" name="fee_structure" accept="image/*,application/pdf" required />
      <FileField label="School receipt (optional)" name="school_receipt" accept="image/*,application/pdf" />
      <button disabled={m.isPending || uploading} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {uploading ? "Uploading…" : m.isPending ? "Submitting…" : "Submit application"}
      </button>
      <p className="text-xs text-muted-foreground">Documents are private and only visible to bursary administrators.</p>
    </form>
  );
}

function FileField({ label, name, accept, required, capture }: { label: string; name: string; accept?: string; required?: boolean; capture?: "user" | "environment" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="file"
        name={name}
        accept={accept}
        capture={capture}
        required={required}
        className="mt-1 block w-full text-sm file:mr-3 file:h-9 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium"
      />
    </label>
  );
}

function ResidencyForm({ profile }: { profile: { full_name: string | null; phone: string | null; ward: string | null; national_id: string | null; residency_status?: string | null } | null }) {
  const submit = useServerFn(submitResidencyVerification);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (data: { full_name: string; phone: string; ward: string; national_id: string }) => submit({ data }),
    onSuccess: () => {
      toast.success("Submitted for admin review");
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
      <p className="text-sm text-muted-foreground">
        Only verified Embakasi West residents can access services. Your details go to constituency admins for review.
      </p>
      <Field label="Full name (as on ID)" name="full_name" required defaultValue={profile?.full_name ?? ""} />
      <Field label="Phone (Safaricom / Airtel)" name="phone" required defaultValue={profile?.phone ?? ""} placeholder="+2547XXXXXXXX" />
      <WardSelect label="Ward" required defaultValue={profile?.ward ?? ""} />
      <Field label="National ID number" name="national_id" required defaultValue={profile?.national_id ?? ""} />
      <button disabled={m.isPending} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-60">
        {m.isPending ? "Submitting…" : "Submit for verification"}
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