import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wudbjohhxzqqxxwhoche.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);