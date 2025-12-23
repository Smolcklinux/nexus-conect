// 1. Configurações Globais
const CONFIG = {
    SUPABASE_URL: "https://wudbjohhxzqqxxwhoche.supabase.co",
    SUPABASE_KEY: "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz",
    VAPI_KEY: "b02c05e7-8b72-4c54-8e2a-99e581bc3ec5",
    SQUAD_ID: "9520961a-3a93-4e15-9095-00fd09a377b1"
};

// 2. Inicialização dos Clientes (COM PROTEÇÃO)
window.supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Função para inicializar a Vapi com segurança
window.vapiInstance = null;
function startVapi() {
    if (typeof Vapi !== 'undefined') {
        window.vapiInstance = new Vapi(CONFIG.VAPI_KEY);
        
        // Configura a animação de fala (Glow) assim que carregar
        window.vapiInstance.on('volume-level', (v) => {
            const el = document.getElementById('local-user');
            if (el) v > 0.05 ? el.classList.add('speaking') : el.classList.remove('speaking');
        });
        console.log("Vapi carregada!");
    } else {
        console.log("Aguardando biblioteca Vapi...");
        setTimeout(startVapi, 500); // Tenta de novo em meio segundo
    }
}
startVapi();

let currentLang = 'pt';

// 3. Lógica de Voz
async function handleAction() {
    const btn = document.getElementById('btn-action');
    if (!window.vapiInstance) return alert("O sistema de voz ainda está carregando. Tente novamente em instantes.");

    if (!window.vapiInstance.isCallActive()) {
        try {
            await window.vapiInstance.start(CONFIG.SQUAD_ID);
            btn.innerText = translations[currentLang].leave;
            btn.style.background = "#ff4b2b";
        } catch (e) { 
            console.error(e);
            alert("Erro ao ligar microfone. Verifique as permissões HTTPS."); 
        }
    } else {
        window.vapiInstance.stop();
        btn.innerText = translations[currentLang].join;
        btn.style.background = "";
    }
}

// 4. Chat em Tempo Real
async function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input.value.trim()) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    await window.supabaseClient.from('messages').insert([
        { 
            content: input.value, 
            user_id: user.id, 
            user_name: user.email.split('@')[0] 
        }
    ]);
    input.value = "";
}

window.supabaseClient
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        renderMessage(payload.new);
    })
    .subscribe();

function renderMessage(msg) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg-bubble';
    div.innerHTML = `<b>${msg.user_name}:</b> ${msg.content}`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// 5. Presença (Quem está Online)
const roomChannel = window.supabaseClient.channel('nexus_room', { config: { presence: { key: 'user' } } });

roomChannel
    .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        updateOnlineUsers(state);
    })
    .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const isVip = document.getElementById('local-user').classList.contains('is-vip');
            await roomChannel.track({ 
                id: user.id, 
                avatar: document.getElementById('user-img').src,
                is_vip: isVip
            });
        }
    });

function updateOnlineUsers(state) {
    const grid = document.querySelector('.avatar-grid');
    grid.querySelectorAll('.avatar-wrapper:not(#local-user)').forEach(el => el.remove());
    
    const myId = window.supabaseClient.auth.user()?.id;
    Object.values(state).forEach(presences => {
        presences.forEach(user => {
            if (user.id !== myId) renderUserAvatar(user);
        });
    });
}

function renderUserAvatar(user) {
    const grid = document.querySelector('.avatar-grid');
    const div = document.createElement('div');
    div.className = `avatar-wrapper ${user.is_vip ? 'is-vip' : ''}`;
    div.innerHTML = `
        <div class="glow-ring"></div>
        <img src="${user.avatar}">
        ${user.is_vip ? '<span id="vip-tag">VIP</span>' : ''}
    `;
    grid.appendChild(div);
}

// 6. Tradução
function updateLanguage(lang) {
    currentLang = lang;
    const btn = document.getElementById('btn-action');
    if (window.vapiInstance) {
        btn.innerText = window.vapiInstance.isCallActive() ? translations[lang].leave : translations[lang].join;
    }
}
