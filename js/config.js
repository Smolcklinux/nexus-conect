const SUPABASE_URL = "https://wudbjohhxzqqxxwhoche.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz";

export const nexusClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true // Adicione isso para ajudar na detecção
    }
});
