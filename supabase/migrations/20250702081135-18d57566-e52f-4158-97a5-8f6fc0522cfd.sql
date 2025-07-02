
-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'sales_manager', 'sales_associate')) DEFAULT 'sales_associate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT CHECK (status IN ('hot', 'warm', 'cold', 'converted', 'lost')) DEFAULT 'cold',
  value DECIMAL(10, 2),
  source TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact TIMESTAMP WITH TIME ZONE
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create policies for leads
CREATE POLICY "Users can view all leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins and managers can update all leads" ON public.leads FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'sales_manager')
  )
);
CREATE POLICY "Sales associates can update assigned leads" ON public.leads FOR UPDATE TO authenticated USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for reminders
CREATE POLICY "Users can view reminders assigned to them or created by them" ON public.reminders FOR SELECT TO authenticated USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);
CREATE POLICY "Users can create reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE TO authenticated USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);
CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE TO authenticated USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for testing
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'manager@example.com', 'Sales Manager', 'sales_manager'),
  ('00000000-0000-0000-0000-000000000003', 'associate@example.com', 'Sales Associate', 'sales_associate');

INSERT INTO public.leads (name, email, company, status, value, assigned_to, created_by) VALUES
  ('Sarah Johnson', 'sarah@acme.com', 'Acme Corp', 'hot', 25000, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('Michael Chen', 'michael@techstart.com', 'TechStart Inc', 'warm', 12500, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('Emily Rodriguez', 'emily@growthco.com', 'GrowthCo', 'cold', 8000, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002');

INSERT INTO public.reminders (title, description, due_date, priority, lead_id, assigned_to, created_by) VALUES
  ('Follow up with Acme Corp', 'Call Sarah Johnson about proposal', NOW() + INTERVAL '2 hours', 'high', (SELECT id FROM public.leads WHERE name = 'Sarah Johnson'), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('Team meeting', 'Weekly sales team sync', NOW() + INTERVAL '4 hours 30 minutes', 'medium', NULL, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');
