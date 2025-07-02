/*
  # Create profiles and leads tables with proper relationships

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text with default 'user')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text)
      - `phone` (text)
      - `company` (text)
      - `status` (text with enum-like constraint)
      - `value` (numeric for currency)
      - `assigned_to` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
    - Profiles can be read by authenticated users
    - Leads can be managed by authenticated users

  3. Relationships
    - leads.assigned_to -> profiles.id (foreign key)
    - profiles.id -> auth.users.id (foreign key)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'sales_rep', 'user')),
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

-- Create policies for profiles
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for leads
CREATE POLICY "Authenticated users can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'manager'),
  ('00000000-0000-0000-0000-000000000003', 'Bob Johnson', 'sales_rep')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (name, email, phone, company, status, value, assigned_to) VALUES
  ('Alice Cooper', 'alice@example.com', '+1-555-0101', 'Cooper Industries', 'hot', 50000, '00000000-0000-0000-0000-000000000002'),
  ('David Wilson', 'david@techcorp.com', '+1-555-0102', 'TechCorp', 'warm', 25000, '00000000-0000-0000-0000-000000000003'),
  ('Sarah Davis', 'sarah@startup.io', '+1-555-0103', 'Startup Inc', 'cold', 15000, NULL),
  ('Michael Brown', 'michael@enterprise.com', '+1-555-0104', 'Enterprise Solutions', 'converted', 75000, '00000000-0000-0000-0000-000000000002'),
  ('Emma Taylor', 'emma@consulting.com', '+1-555-0105', 'Taylor Consulting', 'warm', 30000, '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;