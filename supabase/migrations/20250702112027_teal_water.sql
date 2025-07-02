/*
  # Complete LeadCRM Database Schema Setup
  
  This script combines all migrations to set up the complete database schema.
  Run this in your Supabase SQL Editor to create all necessary tables and functions.
  
  1. New Tables
    - `profiles` - User profiles with roles
    - `leads` - Lead management system
  
  2. Security
    - Row Level Security (RLS) enabled on all tables
    - Role-based access policies
  
  3. Functions
    - `handle_new_user()` - Automatic profile creation trigger
    - `ensure_profile_exists()` - Manual profile creation function
  
  4. Sample Data
    - Test profiles and leads for development
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'sales_associate' CHECK (role IN ('admin', 'sales_manager', 'sales_associate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'cold' CHECK (status IN ('hot', 'warm', 'cold', 'converted', 'lost')),
  value numeric DEFAULT 0,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with proper error handling
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales_associate')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to ensure profile exists (can be called from application)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_id uuid)
RETURNS boolean AS $$
DECLARE
  profile_exists boolean;
  user_email text;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN true;
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    user_id,
    COALESCE(user_email, 'User'),
    'sales_associate'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists(uuid) TO authenticated;

-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  COALESCE(au.raw_user_meta_data->>'role', 'sales_associate')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  role = COALESCE(EXCLUDED.role, profiles.role);

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for leads
DROP POLICY IF EXISTS "Users can read leads based on role" ON leads;
CREATE POLICY "Users can read leads based on role"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'sales_manager') 
        OR (role = 'sales_associate' AND (assigned_to = auth.uid() OR assigned_to IS NULL))
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert leads based on role" ON leads;
CREATE POLICY "Users can insert leads based on role"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_manager', 'sales_associate')
    )
  );

DROP POLICY IF EXISTS "Users can update leads based on role" ON leads;
CREATE POLICY "Users can update leads based on role"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('admin', 'sales_manager') 
        OR (role = 'sales_associate' AND assigned_to = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admins and managers can delete leads" ON leads;
CREATE POLICY "Admins and managers can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'sales_manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Insert sample data for testing (using placeholder UUIDs)
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'sales_manager'),
  ('00000000-0000-0000-0000-000000000003', 'Bob Johnson', 'sales_associate')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (name, email, phone, company, status, value, assigned_to) VALUES
  ('Alice Cooper', 'alice@example.com', '+1-555-0101', 'Cooper Industries', 'hot', 50000, '00000000-0000-0000-0000-000000000002'),
  ('David Wilson', 'david@techcorp.com', '+1-555-0102', 'TechCorp', 'warm', 25000, '00000000-0000-0000-0000-000000000003'),
  ('Sarah Davis', 'sarah@startup.io', '+1-555-0103', 'Startup Inc', 'cold', 15000, NULL),
  ('Michael Brown', 'michael@enterprise.com', '+1-555-0104', 'Enterprise Solutions', 'converted', 75000, '00000000-0000-0000-0000-000000000002'),
  ('Emma Taylor', 'emma@consulting.com', '+1-555-0105', 'Taylor Consulting', 'warm', 30000, '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;