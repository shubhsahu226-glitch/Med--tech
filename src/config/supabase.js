import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard -> Settings -> API
// We will hardcode them here since it's a frontend app, or you can use Vite ENV vars.
// For the sake of simplicity in this demo, we'll use the ones you provided.

const supabaseUrl = 'https://dgfhhjopffftydioegeo.supabase.co';
const supabaseKey = 'sb_publishable_fWGXDMcTYVK2l65RYsBDOg_fmEeVgkL';

export const supabase = createClient(supabaseUrl, supabaseKey);
