/**
 * NEXUS CONECT - Configuração de API
 */

const SUPABASE_URL = "https://wudbjohhxzqqxxwhoche.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz";

// Verificação de segurança
if (typeof supabase === 'undefined') {
    console.error("NEXUS FATAL: SDK do Supabase não carregado.");
}

export const nexusClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

export const NEXUS_CONFIG = {
    VERSION: "1.1.0-STABLE",
    BASE_URL: "https://smolcklinux.github.io/nexus-conect/"
};
