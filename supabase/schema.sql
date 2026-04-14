-- ============================================================
-- NVSU FINES SYSTEM — SUPABASE SQL SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

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
    CHECK (role IN ('admin', 'student', 'ncssc', 'college_org', 'sub_org')),
  student_id_number TEXT UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINES TABLE
CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  issued_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER fines_updated_at
  BEFORE UPDATE ON fines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: auto-create profile on new auth user
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Managers can view all profiles
CREATE POLICY "profiles_select_managers" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ncssc', 'college_org', 'sub_org')
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Admins can insert profiles
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- New users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_self" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- FINES POLICIES
-- Students can view their own fines
CREATE POLICY "fines_select_student" ON fines
  FOR SELECT USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ncssc', 'college_org', 'sub_org')
    )
  );

-- Managers can insert fines
CREATE POLICY "fines_insert_managers" ON fines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ncssc', 'college_org', 'sub_org')
    )
  );

-- Managers can update fines
CREATE POLICY "fines_update_managers" ON fines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ncssc', 'college_org', 'sub_org')
    )
  );

-- Managers can delete fines
CREATE POLICY "fines_delete_managers" ON fines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ncssc', 'college_org', 'sub_org')
    )
  );

-- ORGANIZATIONS POLICIES
-- Everyone authenticated can view organizations
CREATE POLICY "orgs_select_all" ON organizations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage organizations
CREATE POLICY "orgs_manage_admin" ON organizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- SAMPLE DATA (Optional — remove in production)
-- ============================================================

-- Insert sample organizations
INSERT INTO organizations (name, type) VALUES
  ('NCSSC - Student Council', 'ncssc'),
  ('CICS Student Council', 'college'),
  ('CEA Student Council', 'college'),
  ('Junior Philippine Computer Society', 'sub'),
  ('Institute of Computer Engineers', 'sub')
ON CONFLICT DO NOTHING;
