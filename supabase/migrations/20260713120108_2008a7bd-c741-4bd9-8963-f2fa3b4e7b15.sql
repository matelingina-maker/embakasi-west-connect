
-- ============ residency verification ============
DO $$ BEGIN
  CREATE TYPE public.residency_status AS ENUM ('unverified','pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS residency_status public.residency_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS residency_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS residency_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS residency_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS residency_rejection_reason text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- ============ bursary docs ============
ALTER TABLE public.bursary_applications
  ADD COLUMN IF NOT EXISTS result_slip_path text,
  ADD COLUMN IF NOT EXISTS fee_structure_path text,
  ADD COLUMN IF NOT EXISTS school_receipt_path text;

-- ============ issue photo ============
ALTER TABLE public.issue_reports
  ADD COLUMN IF NOT EXISTS photo_path text;

-- ============ opportunity applications ============
CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  phone text,
  cover_letter text,
  cv_path text,
  additional_doc_path text,
  status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_applications TO authenticated;
GRANT ALL ON public.opportunity_applications TO service_role;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications - select" ON public.opportunity_applications
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own applications - insert" ON public.opportunity_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin update applications" ON public.opportunity_applications
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_opp_apps_updated BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ facilities (schools/hospitals/etc) ============
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  ward text NOT NULL,
  location text,
  assessment_score int CHECK (assessment_score BETWEEN 0 AND 100),
  assessment_notes text,
  last_assessed date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facilities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "admin write facilities" ON public.facilities FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_facilities_updated BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ activity log ============
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity insert" ON public.activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read activity" ON public.activity_log FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS activity_log_user_created_idx ON public.activity_log(user_id, created_at DESC);

-- ============ login events ============
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own login insert" ON public.login_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin read logins" ON public.login_events FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS login_events_user_created_idx ON public.login_events(user_id, created_at DESC);

-- ============ storage.objects policies for private buckets ============
-- bursary-docs
CREATE POLICY "bursary owner read" ON storage.objects FOR SELECT
  USING (bucket_id='bursary-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "bursary owner write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='bursary-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "bursary admin read" ON storage.objects FOR SELECT
  USING (bucket_id='bursary-docs' AND public.has_role(auth.uid(),'admin'));

-- opportunity-docs
CREATE POLICY "opp owner read" ON storage.objects FOR SELECT
  USING (bucket_id='opportunity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "opp owner write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='opportunity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "opp admin read" ON storage.objects FOR SELECT
  USING (bucket_id='opportunity-docs' AND public.has_role(auth.uid(),'admin'));

-- issue-photos
CREATE POLICY "issue owner read" ON storage.objects FOR SELECT
  USING (bucket_id='issue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "issue owner write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='issue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "issue admin read" ON storage.objects FOR SELECT
  USING (bucket_id='issue-photos' AND public.has_role(auth.uid(),'admin'));
