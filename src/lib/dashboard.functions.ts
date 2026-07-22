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

export const listFacilities = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("id, name, category, ward, location, assessment_score, assessment_notes, last_assessed")
    .order("category")
    .order("name");
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

export const getActiveAnnouncement = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, message, cta_label, cta_href")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
});

const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  message: z.string().trim().min(3).max(500),
  cta_label: z.string().trim().max(60).optional().nullable(),
  cta_href: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().default(true),
});

export const upsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => announcementSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = data.id
      ? await context.supabase.from("announcements").update(data).eq("id", data.id)
      : await context.supabase.from("announcements").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------------------------------------------------------------
// Helper: verified-resident gate + activity log
// -------------------------------------------------------------------------
type SbClient = ReturnType<typeof publicClient>;

async function requireVerifiedResident(supabase: SbClient, userId: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("residency_status")
    .eq("id", userId)
    .maybeSingle();
  if (!data || data.residency_status !== "verified") {
    throw new Error("Residency not verified. Submit your ID and ward for admin approval first.");
  }
}

async function logActivity(
  supabase: SbClient,
  userId: string,
  action: string,
  entity_type?: string,
  entity_id?: string,
  metadata?: Record<string, unknown>,
) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    entity_type: entity_type ?? null,
    entity_id: entity_id ?? null,
    metadata: (metadata ?? null) as never,
  });
}

// -------------------------------------------------------------------------
// Residency verification
// -------------------------------------------------------------------------
const residencySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  ward: z.string().trim().min(2).max(80),
  national_id: z.string().trim().min(5).max(20),
});

export const submitResidencyVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => residencySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert(
        {
          id: context.userId,
          ...data,
          residency_status: "pending",
          residency_submitted_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "residency_submitted");
    return { ok: true };
  });

export const logSignIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("login_events").insert({ user_id: context.userId });
    return { ok: true };
  });

// -------------------------------------------------------------------------
// Storage: signed URLs for admins to view private docs
// -------------------------------------------------------------------------
export const getSignedDocUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bucket: string; path: string }) =>
    z
      .object({
        bucket: z.enum(["bursary-docs", "opportunity-docs", "issue-photos"]),
        path: z.string().min(1).max(500),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from(data.bucket)
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
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
    const [profile, reports, bursaries, saved, oppApps] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("issue_reports")
        .select("id, title, category, status, ward, photo_path, created_at")
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
      context.supabase
        .from("opportunity_applications")
        .select("id, status, created_at, opportunities(id, title, organization, type)")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      profile: profile.data,
      reports: reports.data ?? [],
      bursaries: bursaries.data ?? [],
      saved: saved.data ?? [],
      oppApps: oppApps.data ?? [],
    };
  });

const reportSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(2000),
  location: z.string().trim().max(200).optional().nullable(),
  ward: z.string().trim().max(80).optional().nullable(),
  photo_path: z.string().trim().max(500).optional().nullable(),
});

export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reportSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireVerifiedResident(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("issue_reports")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "issue_reported", "issue_report", undefined, { title: data.title });
    return { ok: true };
  });

const bursarySchema = z.object({
  student_name: z.string().trim().min(2).max(120),
  school: z.string().trim().min(2).max(160),
  level: z.string().trim().min(2).max(60),
  amount_requested: z.coerce.number().int().min(0).max(1_000_000),
  reason: z.string().trim().max(2000).optional().nullable(),
  result_slip_path: z.string().trim().max(500).optional().nullable(),
  fee_structure_path: z.string().trim().max(500).optional().nullable(),
  school_receipt_path: z.string().trim().max(500).optional().nullable(),
});

export const submitBursary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bursarySchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireVerifiedResident(context.supabase, context.userId);
    if (!data.result_slip_path || !data.fee_structure_path) {
      throw new Error("Result slip and fee structure are required.");
    }
    const { error } = await context.supabase
      .from("bursary_applications")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "bursary_applied", undefined, undefined, { school: data.school });
    return { ok: true };
  });

const oppAppSchema = z.object({
  opportunity_id: z.string().uuid(),
  applicant_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  cover_letter: z.string().trim().max(4000).optional().nullable(),
  cv_path: z.string().trim().max(500).optional().nullable(),
  additional_doc_path: z.string().trim().max(500).optional().nullable(),
});

export const submitOpportunityApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => oppAppSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireVerifiedResident(context.supabase, context.userId);
    if (!data.cv_path) throw new Error("CV / résumé is required to apply.");
    const { error } = await context.supabase
      .from("opportunity_applications")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "opportunity_applied", "opportunity", data.opportunity_id);
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
    const [news, projects, opps, reports, bursaries, oppApps, pendingResidents, facilities, activity, logins] = await Promise.all([
      context.supabase.from("news").select("*").order("created_at", { ascending: false }),
      context.supabase.from("projects").select("*").order("created_at", { ascending: false }),
      context.supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
      context.supabase
        .from("issue_reports")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("bursary_applications")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("opportunity_applications")
        .select("*, opportunities(title, type, organization)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("profiles")
        .select("*")
        .in("residency_status", ["pending", "unverified"])
        .order("residency_submitted_at", { ascending: false, nullsFirst: false }),
      context.supabase.from("facilities").select("*").order("category").order("name"),
      context.supabase
        .from("activity_log")
        .select("id, user_id, action, entity_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("login_events")
        .select("user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    // Merge profile info for reports/bursaries/apps/activity
    const userIds = Array.from(
      new Set([
        ...(reports.data ?? []).map((r) => r.user_id),
        ...(bursaries.data ?? []).map((b) => b.user_id),
        ...(oppApps.data ?? []).map((a) => a.user_id),
        ...(activity.data ?? []).map((a) => a.user_id),
        ...(logins.data ?? []).map((l) => l.user_id),
      ]),
    );
    const profilesById = new Map<string, { full_name: string | null; phone: string | null; ward: string | null }>();
    if (userIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name, phone, ward")
        .in("id", userIds);
      for (const p of profs ?? []) profilesById.set(p.id, p);
    }
    const attach = <T extends { user_id: string }>(row: T) => ({
      ...row,
      profile: profilesById.get(row.user_id) ?? null,
    });

    // Contribution counts per user
    const contribByUser = new Map<string, number>();
    for (const a of activity.data ?? []) {
      contribByUser.set(a.user_id, (contribByUser.get(a.user_id) ?? 0) + 1);
    }
    // Active users in the last 30 days (from login_events)
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeUserIds = new Set(
      (logins.data ?? []).filter((l) => new Date(l.created_at).getTime() > cutoff).map((l) => l.user_id),
    );
    const topContributors = Array.from(contribByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => ({
        user_id: uid,
        contributions: count,
        profile: profilesById.get(uid) ?? null,
      }));

    return {
      news: news.data ?? [],
      projects: projects.data ?? [],
      opportunities: opps.data ?? [],
      reports: (reports.data ?? []).map(attach),
      bursaries: (bursaries.data ?? []).map(attach),
      oppApps: (oppApps.data ?? []).map(attach),
      pendingResidents: pendingResidents.data ?? [],
      facilities: facilities.data ?? [],
      activity: (activity.data ?? []).map(attach),
      activeUserCount: activeUserIds.size,
      topContributors,
    };
  });

// Admin: residency review
export const reviewResidency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_id: string; status: "verified" | "rejected"; reason?: string }) =>
    z.object({
      user_id: z.string().uuid(),
      status: z.enum(["verified", "rejected"]),
      reason: z.string().trim().max(500).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        residency_status: data.status,
        residency_reviewed_by: context.userId,
        residency_reviewed_at: new Date().toISOString(),
        residency_rejection_reason: data.status === "rejected" ? (data.reason ?? null) : null,
      })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: facilities CRUD
const facilitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(60),
  ward: z.string().trim().min(2).max(80),
  location: z.string().trim().max(200).optional().nullable(),
  assessment_score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  assessment_notes: z.string().trim().max(2000).optional().nullable(),
  last_assessed: z.string().trim().max(20).optional().nullable(),
});

export const upsertFacility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => facilitySchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = data.id
      ? await context.supabase.from("facilities").update(data).eq("id", data.id)
      : await context.supabase.from("facilities").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFacility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("facilities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: opportunity application status
export const updateOpportunityAppStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string; admin_notes?: string }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["submitted", "shortlisted", "rejected", "hired"]),
      admin_notes: z.string().trim().max(2000).optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("opportunity_applications")
      .update({ status: data.status, admin_notes: data.admin_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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