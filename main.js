// Configurações extraídas das suas fotos
const SUPABASE_URL = 'https://wudbjohhzqqxxwhoche.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz';
const VAPI_PUBLIC_KEY = 'b02c05e7-8b72-4c54-8e2a-99e581bc3ec5';
const SQUAD_ID = '9520961a-3a93-4e15-9095-00fd09a377b1';

// Inicialização
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);

let isConnected = false;

// Função para ligar/desligar voz estilo SoulChill
async function toggleVoice() {
    const btn = document.getElementById('btn-voice');
    
    if (!isConnected) {
        try {
            await vapiInstance.start(SQUAD_ID); // Conecta ao Squad
            btn.innerText = "Sair da Sala";
            btn.classList.add('active');
            isConnected = true;
        } catch (err) {
            alert("Erro ao acessar microfone");
        }
    } else {
        vapiInstance.stop(); // Encerra a chamada
        btn.innerText = "Entrar na Voz";
        btn.classList.remove('active');
        isConnected = false;
    }
}

// Efeito Visual: Brilho no Avatar ao falar
vapiInstance.on('volume-level', (volume) => {
    const grid = document.getElementById('user-grid');
    if (volume > 0.1) {
        grid.style.borderColor = "#ffd700"; // Brilho VIP/Dourado
        grid.classList.add('speaking');
    } else {
        grid.classList.remove('speaking');
    }
});
