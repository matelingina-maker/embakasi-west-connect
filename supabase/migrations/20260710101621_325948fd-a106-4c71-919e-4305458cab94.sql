
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'resident');
CREATE TYPE public.report_status AS ENUM ('pending','in_progress','resolved','rejected');
CREATE TYPE public.bursary_status AS ENUM ('pending','approved','rejected','disbursed');
CREATE TYPE public.opportunity_type AS ENUM ('Job','Internship','Attachment','Tender');
CREATE TYPE public.project_status AS ENUM ('Planning','Active','Completed');

-- updated_at trigger fn (shared)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================================================
-- PROFILES
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  ward TEXT,
  national_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- USER ROLES
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Auto-create profile + assign role on signup (first signup becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'resident') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- NEWS
-- =========================================================================
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  tag TEXT,
  ward TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_select" ON public.news FOR SELECT TO anon, authenticated USING (published = true OR public.is_admin());
CREATE POLICY "news_admin_insert" ON public.news FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "news_admin_update" ON public.news FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "news_admin_delete" ON public.news FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER news_set_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- PROJECTS
-- =========================================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ward TEXT NOT NULL,
  category TEXT NOT NULL,
  status public.project_status NOT NULL DEFAULT 'Active',
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_select" ON public.projects FOR SELECT TO anon, authenticated USING (published = true OR public.is_admin());
CREATE POLICY "projects_admin_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "projects_admin_update" ON public.projects FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "projects_admin_delete" ON public.projects FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- OPPORTUNITIES
-- =========================================================================
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  type public.opportunity_type NOT NULL,
  location TEXT,
  description TEXT,
  deadline DATE,
  apply_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opps_public_select" ON public.opportunities FOR SELECT TO anon, authenticated USING (published = true OR public.is_admin());
CREATE POLICY "opps_admin_insert" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "opps_admin_update" ON public.opportunities FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "opps_admin_delete" ON public.opportunities FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER opps_set_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- ISSUE REPORTS
-- =========================================================================
CREATE TABLE public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  ward TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issue_reports TO authenticated;
GRANT ALL ON public.issue_reports TO service_role;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_own_select" ON public.issue_reports FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "reports_own_insert" ON public.issue_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_admin_update" ON public.issue_reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "reports_admin_delete" ON public.issue_reports FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON public.issue_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- BURSARY APPLICATIONS
-- =========================================================================
CREATE TABLE public.bursary_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  school TEXT NOT NULL,
  level TEXT NOT NULL,
  amount_requested INT NOT NULL CHECK (amount_requested >= 0),
  reason TEXT,
  status public.bursary_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bursary_applications TO authenticated;
GRANT ALL ON public.bursary_applications TO service_role;
ALTER TABLE public.bursary_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bursary_own_select" ON public.bursary_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "bursary_own_insert" ON public.bursary_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bursary_admin_update" ON public.bursary_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bursary_admin_delete" ON public.bursary_applications FOR DELETE TO authenticated USING (public.is_admin());
CREATE TRIGGER bursary_set_updated_at BEFORE UPDATE ON public.bursary_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- SAVED OPPORTUNITIES (bookmarks)
-- =========================================================================
CREATE TABLE public.saved_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_own_select" ON public.saved_opportunities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "saved_own_insert" ON public.saved_opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_own_delete" ON public.saved_opportunities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indices
CREATE INDEX news_created_idx ON public.news(created_at DESC);
CREATE INDEX projects_created_idx ON public.projects(created_at DESC);
CREATE INDEX opps_deadline_idx ON public.opportunities(deadline);
CREATE INDEX reports_user_idx ON public.issue_reports(user_id);
CREATE INDEX bursary_user_idx ON public.bursary_applications(user_id);
