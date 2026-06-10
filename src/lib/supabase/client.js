// Modular Supabase Client Wrapper
// Exports client from configured credentials

import { supabase } from '../../config/supabase';

export const getSupabaseClient = () => {
  return supabase;
};

export default supabase;
