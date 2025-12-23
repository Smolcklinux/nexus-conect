const CONFIG = {
    SUPABASE_URL: "https://wudbjohhxzqqxxwhoche.supabase.co",
    SUPABASE_KEY: "sb_publishable_yLkb1C_IVOqiQ-yfxdi7hA_wgqfcJdz",
    VAPI_KEY: "b02c05e7-8b72-4c54-8e2a-99e581bc3ec5",
    SQUAD_ID: "9520961a-3a93-4e15-9095-00fd09a377b1"
};

const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
let vapi = null;

// --- NAVEGAÇÃO ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// --- PERFIL ---
async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = {
        id: user.id,
        username: document.getElementById('profile-name').value,
        bio: document.getElementById('profile-bio').value,
        updated_at: new Date()
    };
    await supabase.from('profiles').upsert(updates);
    alert("Perfil atualizado!");
}

async function uploadAvatar() {
    const file = document.getElementById('avatar-file').files[0];
    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `avatars/${user.id}`;
    
    await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    document.getElementById('profile-img-preview').src = publicUrl;
}

// --- VOZ (VAPI) ---
function initVapi() {
    if (typeof Vapi !== 'undefined' && !vapi) {
        vapi = new Vapi(CONFIG.VAPI_KEY);
        vapi.on('volume-level', (v) => {
            const el = document.querySelector('.speaking-indicator');
            if (el) el.style.opacity = v > 0.05 ? "1" : "0";
        });
    }
}

async function toggleVoice() {
    initVapi();
    const btn = document.getElementById('btn-mic');
    if (!vapi.isCallActive()) {
        await vapi.start(CONFIG.SQUAD_ID);
        btn.innerText = "🔇 Desligar";
        btn.classList.add('active');
    } else {
        vapi.stop();
        btn.innerText = "🎙️ Entrar na Voz";
        btn.classList.remove('active');
    }
}

// --- SALA ---
function joinRoom(name) {
    document.getElementById('current-room-name').innerText = name;
    showScreen('screen-room');
    // Aqui iniciaria o Presence do Supabase para ver outros usuários online
}

function leaveRoom() {
    if (vapi) vapi.stop();
    showScreen('screen-home');
}
