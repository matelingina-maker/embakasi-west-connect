import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { submitOpportunityApplication } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/_authenticated/apply/$id")({
  head: () => ({ meta: [{ title: "Apply — E-WEST Hub" }] }),
  component: ApplyPage,
});

async function uploadDoc(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("opportunity-docs").upload(path, file);
  if (error) throw new Error(error.message);
  return path;
}

function ApplyPage() {
  const { id } = useParams({ from: "/_authenticated/apply/$id" });
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const submit = useServerFn(submitOpportunityApplication);
  const m = useMutation({
    mutationFn: (data: { opportunity_id: string; applicant_name: string; phone: string | null; cover_letter: string | null; cv_path: string | null; additional_doc_path: string | null }) => submit({ data }),
    onSuccess: () => { toast.success("Application submitted"); navigate({ to: "/dashboard" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">Apply for opportunity</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const cv = fd.get("cv") as File;
          const extra = fd.get("extra") as File;
          if (!cv?.size) { toast.error("CV is required"); return; }
          try {
            setUploading(true);
            const cvPath = await uploadDoc(cv);
            const extraPath = extra?.size ? await uploadDoc(extra) : null;
            await m.mutateAsync({
              opportunity_id: id,
              applicant_name: fd.get("applicant_name") as string,
              phone: (fd.get("phone") as string) || null,
              cover_letter: (fd.get("cover_letter") as string) || null,
              cv_path: cvPath,
              additional_doc_path: extraPath,
            });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          } finally { setUploading(false); }
        }}
        className="bg-white p-6 rounded-xl ring-1 ring-black/5 space-y-3"
      >
        <label className="block"><span className="text-sm font-medium">Full name</span>
          <input name="applicant_name" required className="mt-1 w-full h-10 px-3 rounded-md ring-1 ring-border text-sm" />
        </label>
        <label className="block"><span className="text-sm font-medium">Phone</span>
          <input name="phone" className="mt-1 w-full h-10 px-3 rounded-md ring-1 ring-border text-sm" />
        </label>
        <label className="block"><span className="text-sm font-medium">Cover letter</span>
          <textarea name="cover_letter" rows={4} className="mt-1 w-full px-3 py-2 rounded-md ring-1 ring-border text-sm" />
        </label>
        <label className="block"><span className="text-sm font-medium">CV / résumé (PDF, required)</span>
          <input type="file" name="cv" accept="application/pdf,image/*" required className="mt-1 block w-full text-sm" />
        </label>
        <label className="block"><span className="text-sm font-medium">Certificates (optional)</span>
          <input type="file" name="extra" accept="application/pdf,image/*" className="mt-1 block w-full text-sm" />
        </label>
        <button disabled={m.isPending || uploading} className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
          {uploading ? "Uploading…" : m.isPending ? "Submitting…" : "Submit application"}
        </button>
        <p className="text-xs text-muted-foreground">You must be a verified resident to submit. Files are private.</p>
      </form>
    </div>
  );
}