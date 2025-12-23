// Configurações Globais Corrigidas
const CONFIG = {
    // URL atualizada com o 'x' correto: wudbjohhXzqqxxwhoche
    SUPABASE_URL: "https://wudbjohhxzqqxxwhoche.supabase.co",
    SUPABASE_KEY: "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz",
    VAPI_KEY: "b02c05e7-8b72-4c54-8e2a-99e581bc3ec5",
    SQUAD_ID: "9520961a-3a93-4e15-9095-00fd09a377b1"
};

// Inicializa os SDKs como variáveis globais para o auth.js enxergar
window.supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
window.vapiInstance = new Vapi(CONFIG.VAPI_KEY);

let currentLang = 'pt';

// Função Principal para Ligar/Desligar Voz
async function handleAction() {
    const btn = document.getElementById('btn-action');
    const vapi = window.vapiInstance;

    if (!vapi.isCallActive()) {
        try {
            // Inicia a conexão com o Squad de Voz
            await vapi.start(CONFIG.SQUAD_ID);
            
            // Interface de Sala Ativa
            btn.innerText = translations[currentLang].leave;
            btn.style.background = "#ff4b2b"; // Cor de "Sair"
            console.log("Nexus Conect: Chamada iniciada.");
        } catch (e) {
            console.error("Erro ao conectar Vapi:", e);
            alert("Erro ao acessar microfone. Verifique as permissões.");
        }
    } else {
        // Encerra a chamada para parar a tarifação ($0.09/min)
        vapi.stop();
        btn.innerText = translations[currentLang].join;
        btn.style.background = ""; // Volta ao gradiente original
        console.log("Nexus Conect: Chamada encerrada.");
    }
}

// Animação de Brilho (Glow) baseada no volume da voz
window.vapiInstance.on('volume-level', (volume) => {
    const userWrapper = document.getElementById('local-user');
    if (userWrapper) {
        // Se o volume for maior que 0.05, ativa o brilho
        if (volume > 0.05) {
            userWrapper.classList.add('speaking');
        } else {
            userWrapper.classList.remove('speaking');
        }
    }
});

// Suporte para erros de conexão na Vapi
window.vapiInstance.on('error', (error) => {
    console.error("Erro na Vapi:", error);
    vapi.stop();
});
