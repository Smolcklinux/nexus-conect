// Configurações Globais
const CONFIG = {
    SUPABASE_URL: "https://wudbjohhzqqxxwhoche.supabase.co",
    SUPABASE_KEY: "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz",
    VAPI_KEY: "b02c05e7-8b72-4c54-8e2a-99e581bc3ec5",
    SQUAD_ID: "9520961a-3a93-4e15-9095-00fd09a377b1"
};

// Inicializa os SDKs como variáveis globais
window.supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
window.vapiInstance = new Vapi(CONFIG.VAPI_KEY);

let currentLang = 'pt';

async function handleAction() {
    const btn = document.getElementById('btn-action');
    const vapi = window.vapiInstance;

    if (!vapi.isCallActive()) {
        try {
            await vapi.start(CONFIG.SQUAD_ID);
            btn.innerText = translations[currentLang].leave;
            btn.classList.add('active');
        } catch (e) {
            alert("Erro ao acessar microfone: " + e.message);
        }
    } else {
        vapi.stop();
        btn.innerText = translations[currentLang].join;
        btn.classList.remove('active');
    }
}

// Animação de fala baseada no volume
window.vapiInstance.on('volume-level', (volume) => {
    const user = document.getElementById('local-user');
    if (volume > 0.05) {
        user.classList.add('speaking');
    } else {
        user.classList.remove('speaking');
    }
});
