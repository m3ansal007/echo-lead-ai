
// This file helps refresh Supabase types by triggering a schema update
import { supabase } from '@/integrations/supabase/client';

export const refreshSupabaseSchema = async () => {
  // Simple query to trigger schema refresh
  const { data, error } = await supabase.from('profiles').select('count').limit(1);
  return { data, error };
};
