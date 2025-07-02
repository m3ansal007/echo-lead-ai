/*
  # Fix roles and authentication system

  1. Updates
    - Update profiles table to use correct role values
    - Fix role constraints to match the application
    - Add proper role handling for new users

  2. Security
    - Ensure RLS policies work correctly with roles
    - Add role-based access controls

  3. Data Migration
    - Update existing role values to match application expectations
*/

-- Update the role constraint to match application roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'sales_manager', 'sales_associate'));

-- Update existing sample data to use correct roles
UPDATE profiles SET role = 'sales_manager' WHERE role = 'manager';
UPDATE profiles SET role = 'sales_associate' WHERE role = 'sales_rep';
UPDATE profiles SET role = 'sales_associate' WHERE role = 'user';

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'sales_associate')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more specific about roles
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

-- Add policy for admins to update any profile
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

-- Update leads policies to be role-based
DROP POLICY IF EXISTS "Authenticated users can read all leads" ON leads;
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

DROP POLICY IF EXISTS "Authenticated users can insert leads" ON leads;
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

DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
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

DROP POLICY IF EXISTS "Authenticated users can delete leads" ON leads;
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