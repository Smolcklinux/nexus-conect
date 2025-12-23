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
let audioCtx, analyser, dataArray;

// --- INICIALIZAÇÃO ---
async function init() {
    ui.loading.classList.add('hidden');
    
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('room');

    nexusClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const { data: p, error } = await nexusClient.from('profiles').select('*').eq('id', session.user.id).single();
            if (error || !p.custom_id) {
                showSection('setup');
            } else {
                handleRoomEntry(session.user.id, inviteId);
            }
        } else {
            showSection('age');
        }
    });
}

// --- LOGICA DE SALA ---
async function handleRoomEntry(userId, inviteId) {
    let room;
    if (inviteId) {
        const { data } = await nexusClient.from('rooms').select('*').eq('id', inviteId).single();
        room = data;
    } else {
        const { data } = await nexusClient.from('rooms').select('*').eq('owner_id', userId).maybeSingle();
        room = data;
        if (!room) {
            const { data: newRoom } = await nexusClient.from('rooms').insert([{ owner_id: userId }]).select().single();
            room = newRoom;
        }
    }

    currentRoomId = room.id;
    roomOwnerId = room.owner_id;
    isOwner = roomOwnerId === userId;
    ui.roomIdDisplay.innerText = currentRoomId.substring(0, 8);

    if (room.is_private && !isOwner) {
        ui.passModal.classList.remove('hidden');
        document.getElementById('btn-verify-password').onclick = () => {
            const pass = document.getElementById('input-room-password').value;
            if (pass === room.password) {
                ui.passModal.classList.add('hidden');
                startStage(userId);
            } else { alert("Senha incorreta!"); }
        };
    } else {
        startStage(userId);
    }
}

function startStage(userId) {
    showSection('app');
    if (isOwner) ui.lockBtn.classList.remove('hidden');
    updatePrivacyUI();
    setupPresence(userId);
}

// --- PRESENCE E SLOTS ---
function setupPresence(userId) {
    const channel = nexusClient.channel(`room_${currentRoomId}`, { config: { presence: { key: userId } } });
    
    channel.on('presence', { event: 'sync' }, () => {
        currentPresenceState = channel.presenceState();
        renderSlots(currentPresenceState);
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            syncUserData(channel, userId);
        }
    });

    // Função para forçar sync
    window.forceSync = () => syncUserData(channel, userId);
}

async function syncUserData(channel, userId) {
    const { data: p } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
    const rank = p.id === roomOwnerId ? 'owner' : (p.is_vip ? 'vip' : 'user');
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
    document.querySelectorAll('.slot').forEach(s => {
        s.innerHTML = '';
        s.className = 'slot';
    });

    const users = Object.values(state).map(u => u[0]);
    document.getElementById('room-count').innerText = `${users.length} ONLINE`;

    users.forEach(u => {
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.classList.add('occupied');
                if (u.rank === 'owner') el.classList.add('rank-owner');
                if (u.rank === 'vip') el.classList.add('rank-vip');
                el.innerHTML = `<img src="${u.avatar}"><span class="rank-tag ${u.rank==='vip'?'tag-vip':''}">${u.rank}</span>`;
                if (!u.muted) el.classList.add('speaking');
            }
        }
    });
}

// --- CLIQUES NOS SLOTS ---
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
        const slotId = parseInt(slot.id.replace('slot-', ''));
        const users = Object.values(currentPresenceState).map(u => u[0]);
        const userInSlot = users.find(u => u.slot === slotId);

        if (userInSlot) {
            // Mostrar Perfil
            document.getElementById('p-card-avatar').src = userInSlot.avatar;
            document.getElementById('p-card-nick').innerText = `@${userInSlot.nick}`;
            document.getElementById('p-card-bio').innerText = userInSlot.bio || "Nexus User";
            ui.profileModal.classList.remove('hidden');
        } else {
            // Sentar/Sair
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
        initVUMeter(localStream);
        document.getElementById('btn-mic-toggle').classList.add('active');
    } catch (e) { alert("Permita o microfone!"); myActiveSlot = null; }
}

function stopMicrophone() {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    isMicMuted = true;
    document.getElementById('btn-mic-toggle').classList.remove('active');
}

document.getElementById('btn-mic-toggle').addEventListener('click', () => {
    if (myActiveSlot === null) return alert("Sente-se primeiro!");
    isMicMuted = !isMicMuted;
    localStream.getAudioTracks()[0].enabled = !isMicMuted;
    document.getElementById('btn-mic-toggle').classList.toggle('active');
    window.forceSync();
});

// --- EVENTOS DE UI (BOTÕES) ---
document.getElementById('btn-age-yes').addEventListener('click', () => showSection('auth'));

document.getElementById('go-to-register').addEventListener('click', () => {
    ui.loginForm.classList.add('hidden');
    ui.regForm.classList.remove('hidden');
});

document.getElementById('go-to-login').addEventListener('click', () => {
    ui.regForm.classList.add('hidden');
    ui.loginForm.classList.remove('hidden');
});

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    if (error) alert("Erro: " + error.message);
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;
    const { error } = await nexusClient.auth.signUp({ email, password: pass });
    if (error) alert("Erro: " + error.message);
    else alert("Verifique seu e-mail!");
});

document.getElementById('btn-save-setup').addEventListener('click', async () => {
    const nick = document.getElementById('setup-nickname').value;
    const bio = document.getElementById('setup-bio').value;
    const { data: { user } } = await nexusClient.auth.getUser();
    const { error } = await nexusClient.from('profiles').update({ 
        custom_id: nick, 
        profile_bio: bio,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`
    }).eq('id', user.id);
    if (!error) location.reload();
});

document.getElementById('close-profile-btn').addEventListener('click', () => ui.profileModal.classList.add('hidden'));

// --- VISIBILIDADE DE SENHA ---
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

// --- FUNÇÕES AUXILIARES ---
function showSection(name) {
    ui.age.classList.add('hidden');
    ui.auth.classList.add('hidden');
    ui.setup.classList.add('hidden');
    ui.app.classList.add('hidden');
    ui[name].classList.remove('hidden');
}

function updatePrivacyUI() { /* Implementação idêntica à anterior */ }
function initVUMeter(stream) { /* Implementação idêntica à anterior */ }

init();
