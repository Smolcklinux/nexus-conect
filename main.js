const CONFIG = {
    SUPABASE_URL: "https://wudbjohhxzqqxxwhoche.supabase.co",
    SUPABASE_KEY: "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz",
    VAPI_KEY: "b02c05e7-8b72-4c54-8e2a-99e581bc3ec5",
    SQUAD_ID: "9520961a-3a93-4e15-9095-00fd09a377b1"
};

// Inicialização Supabase
window.supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
window.vapiInstance = null;

// Resolve o erro de carregamento da Vapi
function initVapi() {
    if (typeof Vapi !== 'undefined') {
        window.vapiInstance = new Vapi(CONFIG.VAPI_KEY);
        setupVapiEvents();
    } else {
        setTimeout(initVapi, 500);
    }
}
initVapi();

let currentLang = 'pt';

async function handleAction() {
    const btn = document.getElementById('btn-action');
    if (!window.vapiInstance) return alert("Sistema carregando...");

    if (!window.vapiInstance.isCallActive()) {
        try {
            await window.vapiInstance.start(CONFIG.SQUAD_ID);
            btn.innerText = translations[currentLang].leave;
            btn.style.background = "#ff4b2b";
        } catch (e) { alert("Erro ao acessar microfone."); }
    } else {
        window.vapiInstance.stop();
        btn.innerText = translations[currentLang].join;
        btn.style.background = "";
    }
}

function setupVapiEvents() {
    window.vapiInstance.on('volume-level', (v) => {
        const el = document.getElementById('local-user');
        if (el) { // Proteção contra erro classList
            v > 0.05 ? el.classList.add('speaking') : el.classList.remove('speaking');
        }
    });
}

// Chat em Tempo Real
async function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input.value.trim()) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    await window.supabaseClient.from('messages').insert([
        { content: input.value, user_id: user.id, user_name: user.email.split('@')[0] }
    ]);
    input.value = "";
}

window.supabaseClient
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'msg-bubble';
        div.innerHTML = `<b>${p.new.user_name}:</b> ${p.new.content}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }).subscribe();

// Presença e Usuários Online
const roomChannel = window.supabaseClient.channel('nexus_room', { config: { presence: { key: 'user' } } });

roomChannel.on('presence', { event: 'sync' }, () => {
    const state = roomChannel.presenceState();
    const grid = document.querySelector('.avatar-grid');
    grid.querySelectorAll('.avatar-wrapper:not(#local-user)').forEach(el => el.remove());
    
    const myId = window.supabaseClient.auth.user()?.id;
    Object.values(state).forEach(pres => pres.forEach(u => {
        if (u.id !== myId) {
            const div = document.createElement('div');
            div.className = 'avatar-wrapper';
            div.innerHTML = `<img src="${u.avatar}"><div class="glow-ring"></div>`;
            grid.appendChild(div);
        }
    }));
}).subscribe(async (s) => {
    if (s === 'SUBSCRIBED') {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const el = document.getElementById('local-user');
        const isVip = el ? el.classList.contains('is-vip') : false; // Correção aqui!
        await roomChannel.track({ id: user.id, avatar: document.getElementById('user-img').src, is_vip: isVip });
    }
});

function updateLanguage(lang) {
    currentLang = lang;
    const btn = document.getElementById('btn-action');
    if (window.vapiInstance) {
        btn.innerText = window.vapiInstance.isCallActive() ? translations[lang].leave : translations[lang].join;
    }
}
