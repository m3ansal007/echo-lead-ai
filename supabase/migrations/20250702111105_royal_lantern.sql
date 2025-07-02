/*
  # Fix Profile Creation and Authentication Issues

  1. Improvements
    - Ensure profile creation trigger works reliably
    - Add better error handling for profile creation
    - Fix any missing profiles for existing users
    - Improve the user registration flow

  2. Security
    - Maintain existing RLS policies
    - Ensure proper role assignment
*/

-- First, let's ensure all existing auth users have profiles
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

-- Recreate the trigger function with better error handling
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

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a function to ensure profile exists (can be called from application)
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