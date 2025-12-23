import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    age: document.getElementById('age-section'),
    auth: document.getElementById('auth-section'),
    setup: document.getElementById('setup-section'),
    app: document.getElementById('app-section'),
    roomIdDisplay: document.getElementById('display-room-id'),
    lockBtn: document.getElementById('btn-admin-lock'),
    privacyStatus: document.getElementById('room-privacy-status'),
    passModal: document.getElementById('password-modal'),
    profileModal: document.getElementById('profile-modal'),
    loginForm: document.getElementById('login-form'),
    regForm: document.getElementById('register-form')
};

let myActiveSlot = null;
let isMicMuted = true;
let localStream = null;
let currentRoomId = null;
let roomOwnerId = null;
let isOwner = false;
let currentPresenceState = {};

// --- INICIALIZAÇÃO ---
async function init() {
    if (ui.loading) ui.loading.classList.add('hidden');
    
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('room');

    nexusClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            // Busca o perfil na sua tabela public.profiles
            const { data: p, error } = await nexusClient
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Se não houver perfil ou não tiver nickname (custom_id), vai para o setup
            if (error || !p || !p.custom_id) {
                showSection('setup');
            } else {
                handleRoomEntry(session.user.id, inviteId);
            }
        } else {
            // Verifica se já passou pela tela de idade
            const ageVerified = localStorage.getItem('nexus_age_verified');
            showSection(ageVerified ? 'auth' : 'age');
        }
    });
}

// --- LOGICA DE SALA ---
async function handleRoomEntry(userId, inviteId) {
    let room;
    try {
        if (inviteId) {
            const { data } = await nexusClient.from('rooms').select('*').eq('id', inviteId).single();
            room = data;
        } else {
            const { data } = await nexusClient.from('rooms').select('*').eq('owner_id', userId).maybeSingle();
            room = data;
            if (!room) {
                const { data: newRoom, error: roomError } = await nexusClient.from('rooms').insert([
                    { owner_id: userId, title: `Nexus Space` }
                ]).select().single();
                if (roomError) throw roomError;
                room = newRoom;
            }
        }

        currentRoomId = room.id;
        roomOwnerId = room.owner_id;
        isOwner = roomOwnerId === userId;
        
        if (ui.roomIdDisplay) ui.roomIdDisplay.innerText = currentRoomId.substring(0, 8);
        
        startStage(userId);

    } catch (err) {
        console.error("Erro ao entrar na sala:", err);
        alert("Erro ao carregar sala. Redirecionando...");
        showSection('auth');
    }
}

function startStage(userId) {
    showSection('app');
    if (isOwner && ui.lockBtn) ui.lockBtn.classList.remove('hidden');
    setupPresence(userId);
}

// --- PRESENCE E SLOTS ---
function setupPresence(userId) {
    const channel = nexusClient.channel(`room_${currentRoomId}`, { 
        config: { presence: { key: userId } } 
    });
    
    channel.on('presence', { event: 'sync' }, () => {
        currentPresenceState = channel.presenceState();
        renderSlots(currentPresenceState);
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            syncUserData(channel, userId);
        }
    });

    window.forceSync = () => syncUserData(channel, userId);
}

async function syncUserData(channel, userId) {
    const { data: p } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
    if (!p) return;

    const rank = p.id === roomOwnerId ? 'owner' : (p.role || 'user');
    
    await channel.track({
        id: userId,
        nick: p.custom_id,
        avatar: p.avatar_url,
        bio: p.profile_bio,
        slot: myActiveSlot,
        muted: isMicMuted,
        rank: rank
    });
}

function renderSlots(state) {
    // Limpa todos os slots antes de renderizar
    document.querySelectorAll('.slot').forEach(s => {
        s.innerHTML = '';
        s.className = 'slot';
    });

    const users = Object.values(state).flat();
    const roomCount = document.getElementById('room-count');
    if (roomCount) roomCount.innerText = `${users.length} ONLINE`;

    users.forEach(u => {
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.classList.add('occupied');
                if (u.rank === 'owner') el.classList.add('rank-owner');
                if (u.rank === 'vip') el.classList.add('rank-vip');
                
                el.innerHTML = `
                    <img src="${u.avatar}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus'">
                    <span class="rank-tag">${u.rank.toUpperCase()}</span>
                `;
                if (!u.muted) el.classList.add('speaking');
            }
        }
    });
}

// --- CLIQUES NOS SLOTS ---
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
        const slotId = parseInt(slot.id.replace('slot-', ''));
        const users = Object.values(currentPresenceState).flat();
        const userInSlot = users.find(u => u.slot === slotId);

        if (userInSlot) {
            // Mostrar Perfil
            if (ui.profileModal) {
                document.getElementById('p-card-avatar').src = userInSlot.avatar;
                document.getElementById('p-card-nick').innerText = `@${userInSlot.nick}`;
                document.getElementById('p-card-bio').innerText = userInSlot.bio || "Explorando o Nexus...";
                document.getElementById('p-card-rank').innerText = userInSlot.rank.toUpperCase();
                ui.profileModal.classList.remove('hidden');
            }
        } else {
            // Lógica de sentar/levantar
            if (myActiveSlot === slotId) {
                myActiveSlot = null;
                stopMicrophone();
            } else {
                myActiveSlot = slotId;
                startMicrophone();
            }
            window.forceSync();
        }
    });
});

// --- AUDIO ---
async function startMicrophone() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMicMuted = false;
        const micBtn = document.getElementById('btn-mic-toggle');
        if (micBtn) micBtn.classList.add('active');
        // Aqui você integraria com o WebRTC/Vapi para transmitir o áudio
    } catch (e) { 
        alert("Erro ao acessar microfone. Verifique as permissões."); 
        myActiveSlot = null;
        window.forceSync();
    }
}

function stopMicrophone() {
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }
    isMicMuted = true;
    const micBtn = document.getElementById('btn-mic-toggle');
    if (micBtn) micBtn.classList.remove('active');
}

// Botão de Mic Manual
document.getElementById('btn-mic-toggle')?.addEventListener('click', () => {
    if (myActiveSlot === null) return alert("Sente-se em um slot primeiro!");
    isMicMuted = !isMicMuted;
    if (localStream) {
        localStream.getAudioTracks()[0].enabled = !isMicMuted;
    }
    document.getElementById('btn-mic-toggle').classList.toggle('active', !isMicMuted);
    window.forceSync();
});

// --- EVENTOS DE UI ---
document.getElementById('btn-age-yes')?.addEventListener('click', () => {
    localStorage.setItem('nexus_age_verified', 'true');
    showSection('auth');
});

document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    if (!email || !pass) return alert("Preencha todos os campos.");

    ui.loading.classList.remove('hidden');
    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    if (error) alert("Erro: " + error.message);
    ui.loading.classList.add('hidden');
});

document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const nick = document.getElementById('reg-username').value;

    if (!email || !pass || !nick) return alert("Preencha todos os campos.");

    ui.loading.classList.remove('hidden');
    const { data, error } = await nexusClient.auth.signUp({ email, password: pass });
    
    if (error) {
        alert("Erro: " + error.message);
    } else if (data.user) {
        const { error: profileError } = await nexusClient.from('profiles').insert([
            { 
                id: data.user.id, 
                custom_id: nick, 
                profile_bio: 'Explorando o Nexus...',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`
            }
        ]);
        if (profileError) console.error(profileError);
        alert("Cadastro realizado! Faça login agora.");
        ui.regForm.classList.add('hidden');
        ui.loginForm.classList.remove('hidden');
    }
    ui.loading.classList.add('hidden');
});

document.getElementById('btn-save-setup')?.addEventListener('click', async () => {
    const nick = document.getElementById('setup-nickname').value;
    const bio = document.getElementById('setup-bio').value;
    const { data: { user } } = await nexusClient.auth.getUser();
    
    const { error } = await nexusClient.from('profiles').update({ 
        custom_id: nick, 
        profile_bio: bio,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`
    }).eq('id', user.id);
    
    if (!error) location.reload();
    else alert(error.message);
});

document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

document.getElementById('go-to-register')?.addEventListener('click', () => {
    ui.loginForm.classList.add('hidden');
    ui.regForm.classList.remove('hidden');
});

document.getElementById('go-to-login')?.addEventListener('click', () => {
    ui.regForm.classList.add('hidden');
    ui.loginForm.classList.remove('hidden');
});

document.getElementById('close-profile-btn')?.addEventListener('click', () => ui.profileModal.classList.add('hidden'));

// Alternar Senha
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
});

function showSection(name) {
    Object.values(ui).forEach(el => {
        if (el && el.classList.contains('auth-container')) el.classList.add('hidden');
    });
    if (ui[name]) ui[name].classList.remove('hidden');
}

// Inicia o app
init();
