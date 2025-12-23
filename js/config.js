/**
 * NEXUS CONECT - Configuração Central de API
 * Desenvolvedor: Nexus
 * Ambiente: https://smolcklinux.github.io/nexus-conect/
 */

// 1. CREDENCIAIS OFICIAIS DO NEXUS CONECT
const SUPABASE_URL = "https://wudbjohhxzqqxxwhoche.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz";

// 2. INICIALIZAÇÃO DO CLIENTE
if (typeof supabase === 'undefined') {
    throw new Error("NEXUS FATAL ERROR: SDK do Supabase não carregado.");
}

export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: { 'x-application-name': 'nexus-conect-prod' },
    }
});

/**
 * CONFIGURAÇÕES TÉCNICAS
 */
export const NEXUS_CONFIG = {
    VERSION: "1.0.6-STABLE",
    MAX_ACCOUNTS_PER_DEVICE: 5,
    CHAT_COOLDOWN_NORMAL: 2000,
    CHAT_COOLDOWN_STAFF: 500,
    COINS_PER_MESSAGE: 1,
    DEFAULT_ROOM_ID: "lobby-central",
    BASE_URL: "https://smolcklinux.github.io/nexus-conect/"
};

// Log de Verificação
console.log("%c 🚀 NEXUS CONECT: ONLINE ", 'background: #6200ea; color: #fff; padding: 5px; border-radius: 5px;');
