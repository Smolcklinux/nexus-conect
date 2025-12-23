const SUPABASE_URL = "https://wudbjohhxzqqxxwhoche.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz";

export const nexusClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    },
    realtime: {
        params: {
            events_per_second: 10
        }
    }
});

export const NEXUS_CONFIG = {
    VERSION: "1.2.0-NEBULA",
    BASE_URL: "https://smolcklinux.github.io/nexus-conect/"
};
