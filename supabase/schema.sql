-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ncssc', 'college', 'sub')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student'
  student_id_number TEXT UNIQUE,
  pending_full_name TEXT,
  pending_student_id TEXT,
  email TEXT,
  college TEXT,
  course TEXT,
  year_section TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fine_added', 'fine_paid', 'profile_approved', 'profile_rejected')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID, -- ID of related fine or profile change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER fines_updated_at
  BEFORE UPDATE ON public.fines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TRIGGER: auto-create profile on new auth user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECURE ROLE HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ----------------- PROFILES POLICIES -----------------
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_managers" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;

-- Everyone can view profiles (Fixes infinite recursion bug)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile (Uses security definer to avoid infinite loops)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING ( get_my_role() = 'admin' );

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK ( get_my_role() = 'admin' );

-- New users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ----------------- FINES POLICIES -----------------
DROP POLICY IF EXISTS "fines_select_student" ON fines;
DROP POLICY IF EXISTS "fines_select_policy" ON fines;
DROP POLICY IF EXISTS "fines_insert_managers" ON fines;
DROP POLICY IF EXISTS "fines_update_managers" ON fines;
DROP POLICY IF EXISTS "fines_delete_managers" ON fines;

-- Students can view their own fines, managers can view all
CREATE POLICY "fines_select_policy" ON fines
  FOR SELECT USING (
    auth.uid() = student_id OR get_my_role() IN ('admin', 'ncssc', 'college_org', 'sub_org')
  );

-- Managers can insert fines
CREATE POLICY "fines_insert_managers" ON fines
  FOR INSERT WITH CHECK ( get_my_role() IN ('admin', 'ncssc', 'college_org', 'sub_org') );

-- Managers can update fines
CREATE POLICY "fines_update_managers" ON fines
  FOR UPDATE USING ( get_my_role() IN ('admin', 'ncssc', 'college_org', 'sub_org') );

-- Managers can delete fines
CREATE POLICY "fines_delete_managers" ON fines
  FOR DELETE USING ( get_my_role() IN ('admin', 'ncssc', 'college_org', 'sub_org') );

-- ----------------- NOTIFICATIONS POLICIES -----------------
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System/managers can insert notifications
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK ( get_my_role() IN ('admin', 'ncssc', 'college_org', 'sub_org') );

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------- ORGANIZATIONS POLICIES -----------------
DROP POLICY IF EXISTS "orgs_select_all" ON organizations;
DROP POLICY IF EXISTS "orgs_manage_admin" ON organizations;

-- Everyone authenticated can view organizations
CREATE POLICY "orgs_select_all" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage organizations
CREATE POLICY "orgs_manage_admin" ON organizations
  FOR ALL USING ( get_my_role() = 'admin' );

-- ============================================================
-- SAMPLE DATA (Optional)
-- ============================================================

INSERT INTO organizations (name, type) VALUES
  ('NCSSC - Student Council', 'ncssc'),
  ('CICS Student Council', 'college'),
  ('CEA Student Council', 'college'),
  ('Junior Philippine Computer Society', 'sub'),
  ('Institute of Computer Engineers', 'sub')
ON CONFLICT DO NOTHING;
