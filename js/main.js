import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    age: document.getElementById('age-section'),
    auth: document.getElementById('auth-section'),
    setup: document.getElementById('setup-section'),
    app: document.getElementById('app-section'),
    home: document.getElementById('home-nebula'),
    nebulaContainer: document.getElementById('online-users-container'),
    roomIdDisplay: document.getElementById('display-room-id'),
    lockBtn: document.getElementById('btn-admin-lock'),
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
let nebulaChannel = null;

// --- INICIALIZAÇÃO ---
async function init() {
    try {
        const { data: { session }, error: sessionError } = await nexusClient.auth.getSession();
        
        if (sessionError && sessionError.message.includes("Refresh Token Not Found")) {
            await nexusClient.auth.signOut();
            localStorage.clear();
            return location.reload();
        }
        
        nexusClient.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                const { data: p } = await nexusClient.from('profiles').select('*').eq('id', session.user.id).single();
                
                if (!p || !p.custom_id) {
                    showSection('setup');
                } else {
                    const urlParams = new URLSearchParams(window.location.search);
                    const inviteId = urlParams.get('room');
                    
                    if (inviteId) {
                        handleRoomEntry(session.user.id, inviteId);
                    } else {
                        startNebula(session.user.id, p);
                    }
                }
            } else {
                const ageVerified = localStorage.getItem('nexus_age_verified');
                showSection(ageVerified ? 'auth' : 'age');
            }
            setTimeout(() => { if (ui.loading) ui.loading.classList.add('hidden'); }, 500);
        });
        
    } catch (err) {
        showSection('auth');
        if (ui.loading) ui.loading.classList.add('hidden');
    }
}

// --- LÓGICA DA NEBULOSA (HOME) ---
function startNebula(userId, profile) {
    showSection('home');
    if (nebulaChannel) nebulaChannel.unsubscribe();
    
    nebulaChannel = nexusClient.channel('nebula_main');
    
    nebulaChannel.on('presence', { event: 'sync' }, () => {
        if (!ui.nebulaContainer) return;
        ui.nebulaContainer.innerHTML = '';
        const users = Object.values(nebulaChannel.presenceState()).flat();
        
        users.forEach(u => {
            const bubble = document.createElement('div');
            bubble.className = 'user-bubble';
            bubble.style.left = `${Math.random() * 80 + 5}%`;
            bubble.style.top = `${Math.random() * 70 + 10}%`;
            bubble.innerHTML = `<img src="${u.avatar}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus'">`;
            bubble.onclick = () => openProfile(u);
            ui.nebulaContainer.appendChild(bubble);
        });
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await nebulaChannel.track({
                id: userId,
                nick: profile.custom_id,
                avatar: profile.avatar_url,
                bio: profile.profile_bio,
                rank: profile.role || 'user'
            });
        }
    });
}

// --- LOGICA DE ENTRADA EM SALA ---
async function handleRoomEntry(userId, inviteId) {
    try {
        const { data: room, error } = await nexusClient.from('rooms').select('*').eq('id', inviteId).single();
        if (error || !room) {
            alert("SALA NAO ENCONTRADA");
            window.location.search = '';
            return;
        }
        currentRoomId = room.id;
        roomOwnerId = room.owner_id;
        isOwner = roomOwnerId === userId;
        if (ui.roomIdDisplay) ui.roomIdDisplay.innerText = currentRoomId;
        showSection('app');
        setupPresence(userId);
    } catch (err) {
        window.location.search = '';
    }
}

// --- PRESENCE DA SALA DE VOZ ---
function setupPresence(userId) {
    const channel = nexusClient.channel(`room_${currentRoomId}`, {
        config: { presence: { key: userId } }
    });
    channel.on('presence', { event: 'sync' }, () => {
        currentPresenceState = channel.presenceState();
        renderSlots(currentPresenceState);
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') syncUserData(channel, userId);
    });
    window.forceSync = () => syncUserData(channel, userId);
}

async function syncUserData(channel, userId) {
    const { data: p } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
    if (!p) return;
    await channel.track({
        id: userId,
        nick: p.custom_id,
        avatar: p.avatar_url,
        bio: p.profile_bio,
        slot: myActiveSlot,
        muted: isMicMuted,
        rank: userId === roomOwnerId ? 'owner' : (p.role || 'user')
    });
}

function renderSlots(state) {
    document.querySelectorAll('.slot').forEach(s => { s.innerHTML = '';
        s.className = 'slot'; });
    const users = Object.values(state).flat();
    users.forEach(u => {
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.classList.add('occupied');
                if (u.rank === 'owner') el.classList.add('rank-owner');
                el.innerHTML = `<img src="${u.avatar}"><span class="rank-tag">${u.rank.toUpperCase()}</span>`;
                if (!u.muted) el.classList.add('speaking');
            }
        }
    });
}

function openProfile(user) {
    document.getElementById('p-card-avatar').src = user.avatar;
    document.getElementById('p-card-nick').innerText = `@${user.nick}`;
    document.getElementById('p-card-bio').innerText = user.bio || "EXPLORANDO O NEXUS...";
    if (ui.profileModal) ui.profileModal.classList.remove('hidden');
}

// --- EVENTOS DE AUTH E UI ---

// Troca de formulários
document.getElementById('go-to-register')?.addEventListener('click', () => {
    ui.loginForm.classList.add('hidden');
    ui.regForm.classList.remove('hidden');
});

document.getElementById('go-to-login')?.addEventListener('click', () => {
    ui.regForm.classList.add('hidden');
    ui.loginForm.classList.remove('hidden');
});

// Mostrar/Esconder Senha (Sem Emoji)
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.innerHTML = 'VER'; // Substituído o emoji de olho
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = 'OCULTAR';
        } else {
            input.type = 'password';
            btn.innerHTML = 'VER';
        }
    });
});

// Cadastro de Usuário
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const nick = document.getElementById('reg-username').value;
    
    if (!email || !pass || !nick) return alert("PREENCHA TODOS OS CAMPOS");
    
    ui.loading.classList.remove('hidden');
    const { data, error } = await nexusClient.auth.signUp({ email, password: pass });
    
    if (error) {
        alert("ERRO: " + error.message);
    } else if (data.user) {
        // Criação do perfil com seus termos
        const { error: pErr } = await nexusClient.from('profiles').insert([{
            id: data.user.id,
            custom_id: nick,
            profile_bio: 'EXPLORANDO O NEXUS...',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`
        }]);
        if (pErr) console.error(pErr);
        alert("CADASTRO REALIZADO COM SUCESSO");
        ui.regForm.classList.add('hidden');
        ui.loginForm.classList.remove('hidden');
    }
    ui.loading.classList.add('hidden');
});

// Login
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    ui.loading.classList.remove('hidden');
    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    if (error) alert("FALHA NO LOGIN: " + error.message);
    ui.loading.classList.add('hidden');
});

// Outros Botões
document.getElementById('btn-age-yes')?.addEventListener('click', () => {
    localStorage.setItem('nexus_age_verified', 'true');
    showSection('auth');
});

document.getElementById('btn-create-room-trigger')?.addEventListener('click', async () => {
    const { data: { user } } = await nexusClient.auth.getUser();
    const randomId = `${Math.floor(100+Math.random()*899)}-${Math.floor(100+Math.random()*899)}`;
    const { error } = await nexusClient.from('rooms').insert([{ id: randomId, owner_id: user.id, title: `SALA DE ${nick}` }]);
    if (!error) window.location.search = `?room=${randomId}`;
});

document.getElementById('btn-leave-room')?.addEventListener('click', () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    window.location.search = '';
});

document.getElementById('btn-logout-main')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

document.getElementById('close-profile-btn')?.addEventListener('click', () => ui.profileModal.classList.add('hidden'));

function showSection(name) {
    ['age', 'auth', 'setup', 'home', 'app'].forEach(s => {
        if (ui[s]) ui[s].classList.add('hidden');
    });
    if (ui[name]) ui[name].classList.remove('hidden');
}

init();