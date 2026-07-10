import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------------------------------------------------------------------------
// Public (anon) read-only helpers
// -------------------------------------------------------------------------
function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listNews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("news")
    .select("id, title, summary, tag, ward, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, description, ward, category, status, progress, image_url, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, organization, type, location, deadline, apply_url, description, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const searchContent = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) =>
    z.object({ q: z.string().trim().max(100) }).parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const q = data.q.trim();
    if (!q) return { news: [], projects: [], opportunities: [] };
    const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const [news, projects, opps] = await Promise.all([
      supabase
        .from("news")
        .select("id, title, summary, tag, created_at")
        .eq("published", true)
        .or(`title.ilike.${like},summary.ilike.${like}`)
        .limit(10),
      supabase
        .from("projects")
        .select("id, title, description, ward, status, progress, category")
        .eq("published", true)
        .or(`title.ilike.${like},description.ilike.${like},ward.ilike.${like}`)
        .limit(10),
      supabase
        .from("opportunities")
        .select("id, title, organization, type, deadline")
        .eq("published", true)
        .or(`title.ilike.${like},organization.ilike.${like}`)
        .limit(10),
    ]);
    return {
      news: news.data ?? [],
      projects: projects.data ?? [],
      opportunities: opps.data ?? [],
    };
  });

// -------------------------------------------------------------------------
// Authenticated user data
// -------------------------------------------------------------------------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const profileSchema = z.object({
  full_name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  ward: z.string().trim().max(80).optional().nullable(),
  national_id: z.string().trim().max(30).optional().nullable(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, reports, bursaries, saved] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("issue_reports")
        .select("id, title, category, status, ward, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("bursary_applications")
        .select("id, student_name, school, level, amount_requested, status, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("saved_opportunities")
        .select("opportunity_id, created_at, opportunities(id, title, organization, type, deadline)")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    return {
      profile: profile.data,
      reports: reports.data ?? [],
      bursaries: bursaries.data ?? [],
      saved: saved.data ?? [],
    };
  });

const reportSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(2000),
  location: z.string().trim().max(200).optional().nullable(),
  ward: z.string().trim().max(80).optional().nullable(),
});

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reportSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("issue_reports")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const bursarySchema = z.object({
  student_name: z.string().trim().min(2).max(120),
  school: z.string().trim().min(2).max(160),
  level: z.string().trim().min(2).max(60),
  amount_requested: z.coerce.number().int().min(0).max(1_000_000),
  reason: z.string().trim().max(2000).optional().nullable(),
});

export const submitBursary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bursarySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bursary_applications")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleSavedOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { opportunity_id: string; save: boolean }) =>
    z
      .object({ opportunity_id: z.string().uuid(), save: z.boolean() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (data.save) {
      const { error } = await context.supabase
        .from("saved_opportunities")
        .upsert(
          { user_id: context.userId, opportunity_id: data.opportunity_id },
          { onConflict: "user_id,opportunity_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("saved_opportunities")
        .delete()
        .eq("user_id", context.userId)
        .eq("opportunity_id", data.opportunity_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// -------------------------------------------------------------------------
// Admin
// -------------------------------------------------------------------------
async function assertAdmin(supabase: ReturnType<typeof createClient<Database>>, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [news, projects, opps, reports, bursaries] = await Promise.all([
      context.supabase.from("news").select("*").order("created_at", { ascending: false }),
      context.supabase.from("projects").select("*").order("created_at", { ascending: false }),
      context.supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
      context.supabase
        .from("issue_reports")
        .select("*, profiles:profiles!issue_reports_user_id_fkey(full_name, phone, ward)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("bursary_applications")
        .select("*, profiles:profiles!bursary_applications_user_id_fkey(full_name, phone)")
        .order("created_at", { ascending: false }),
    ]);
    return {
      news: news.data ?? [],
      projects: projects.data ?? [],
      opportunities: opps.data ?? [],
      reports: reports.data ?? [],
      bursaries: bursaries.data ?? [],
    };
  });

const newsInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().min(3).max(500),
  body: z.string().trim().max(10000).optional().nullable(),
  tag: z.string().trim().max(60).optional().nullable(),
  ward: z.string().trim().max(80).optional().nullable(),
  published: z.boolean().default(true),
});

export const upsertNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => newsInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = { ...data, author_id: context.userId };
    const { error } = data.id
      ? await context.supabase.from("news").update(payload).eq("id", data.id)
      : await context.supabase.from("news").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const projectInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(2000),
  ward: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60),
  status: z.enum(["Planning", "Active", "Completed"]),
  progress: z.coerce.number().int().min(0).max(100),
  image_url: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().default(true),
});

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => projectInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = data.id
      ? await context.supabase.from("projects").update(data).eq("id", data.id)
      : await context.supabase.from("projects").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const oppInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  organization: z.string().trim().min(2).max(160),
  type: z.enum(["Job", "Internship", "Attachment", "Tender"]),
  location: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  deadline: z.string().trim().max(40).optional().nullable(),
  apply_url: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().default(true),
});

export const upsertOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => oppInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = data.id
      ? await context.supabase.from("opportunities").update(data).eq("id", data.id)
      : await context.supabase.from("opportunities").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string; admin_notes?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "in_progress", "resolved", "rejected"]),
        admin_notes: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("issue_reports")
      .update({ status: data.status, admin_notes: data.admin_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBursaryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string; admin_notes?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "disbursed"]),
        admin_notes: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("bursary_applications")
      .update({ status: data.status, admin_notes: data.admin_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });