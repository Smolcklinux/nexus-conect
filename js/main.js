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
    profileModal: document.getElementById('profile-modal')
};

let myActiveSlot = null;
let isMicMuted = true;
let localStream = null;
let currentRoomId = null;
let roomOwnerId = null;
let isOwner = false;
let currentPresenceState = {};
let audioCtx, analyser, dataArray;

async function init() {
    ui.loading.classList.add('hidden');
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('room');
    
    nexusClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const { data: p } = await nexusClient.from('profiles').select('*').eq('id', session.user.id).single();
            if (!p.custom_id) showSection('setup');
            else handleRoomEntry(session.user.id, inviteId);
        }
    });
}

async function handleRoomEntry(userId, inviteId) {
    let { data: room } = inviteId ? 
        await nexusClient.from('rooms').select('*').eq('id', inviteId).single() : 
        await nexusClient.from('rooms').select('*').eq('owner_id', userId).maybeSingle();

    if (!room && !inviteId) {
        const { data: nr } = await nexusClient.from('rooms').insert([{ owner_id: userId }]).select().single();
        room = nr;
    }

    currentRoomId = room.id;
    roomOwnerId = room.owner_id;
    isOwner = roomOwnerId === userId;
    ui.roomIdDisplay.innerText = currentRoomId.substring(0, 8);

    if (room.is_private && !isOwner) {
        ui.passModal.classList.remove('hidden');
        document.getElementById('btn-verify-password').onclick = () => {
            if (document.getElementById('input-room-password').value === room.password) {
                ui.passModal.classList.add('hidden'); startStage(userId);
            } else alert("SENHA INCORRETA!");
        };
    } else startStage(userId);
}

function startStage(userId) {
    showSection('app');
    if (isOwner) ui.lockBtn.classList.remove('hidden');
    updatePrivacyUI();
    setupPresence(userId);
}

window.togglePrivacy = async () => {
    if (!isOwner) return;
    const { data: r } = await nexusClient.from('rooms').select('is_private').eq('id', currentRoomId).single();
    if (r.is_private) await nexusClient.from('rooms').update({ is_private: false, password: null }).eq('id', currentRoomId);
    else {
        const p = prompt("SENHA:");
        if (p) await nexusClient.from('rooms').update({ is_private: true, password: p }).eq('id', currentRoomId);
    }
    updatePrivacyUI();
};

async function updatePrivacyUI() {
    const { data: r } = await nexusClient.from('rooms').select('is_private').eq('id', currentRoomId).single();
    ui.privacyStatus.innerText = r.is_private ? "🔒 PRIVADA" : "🔓 PÚBLICA";
    ui.lockBtn.innerText = r.is_private ? "ABRIR" : "TRANCAR";
}

function setupPresence(userId) {
    const channel = nexusClient.channel(`room_${currentRoomId}`, { config: { presence: { key: userId } } });
    channel.on('presence', { event: 'sync' }, () => {
        currentPresenceState = channel.presenceState();
        renderSlots(currentPresenceState);
    }).subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
            const { data: p } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
            const rank = p.id === roomOwnerId ? 'owner' : (p.is_vip ? 'vip' : 'user');
            await channel.track({ id: userId, nick: p.custom_id, avatar: p.avatar_url, bio: p.profile_bio, slot: myActiveSlot, muted: isMicMuted, rank });
        }
    });

    window.syncState = async () => {
        const { data: p } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
        const rank = p.id === roomOwnerId ? 'owner' : (p.is_vip ? 'vip' : 'user');
        await channel.track({ id: userId, nick: p.custom_id, avatar: p.avatar_url, bio: p.profile_bio, slot: myActiveSlot, muted: isMicMuted, rank });
    };
}

function renderSlots(state) {
    document.querySelectorAll('.slot').forEach(s => { s.innerHTML = ''; s.className = s.id === 'slot-0' ? 'slot owner-slot' : 'slot'; });
    const users = Object.values(state).map(u => u[0]);
    document.getElementById('room-count').innerText = `${users.length} ONLINE`;
    users.forEach(u => {
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.classList.add('occupied');
                if (u.rank === 'owner') el.classList.add('rank-owner');
                if (u.rank === 'vip') el.classList.add('rank-vip');
                el.innerHTML = `<img src="${u.avatar}"><span class="rank-tag ${u.rank==='vip'?'tag-vip':''}">${u.rank.toUpperCase()}</span>`;
                if (!u.muted) el.classList.add('speaking');
            }
        }
    });
}

/**
 * LOGICA DE CLIQUE NO SLOT (DIFERENCIADA)
 */
window.handleSlotClick = (slotId) => {
    // Busca se alguém está nesse slot
    const users = Object.values(currentPresenceState).map(u => u[0]);
    const userInSlot = users.find(u => u.slot === slotId);

    if (userInSlot) {
        // SE OCUPADO: MOSTRA PERFIL
        showProfileCard(userInSlot);
    } else {
        // SE VAZIO: SENTA OU SAI
        handleSeatAction(slotId);
    }
};

function showProfileCard(user) {
    document.getElementById('p-card-avatar').src = user.avatar;
    document.getElementById('p-card-nick').innerText = `@${user.nick}`;
    document.getElementById('p-card-bio').innerText = user.bio || "Nenhuma bio definida.";
    document.getElementById('p-card-rank').innerText = user.rank.toUpperCase();
    document.getElementById('p-card-rank').style.color = user.rank === 'owner' ? '#ffcc00' : '#00f2ff';
    ui.profileModal.classList.remove('hidden');
}

async function handleSeatAction(slotId) {
    if (myActiveSlot === slotId) { myActiveSlot = null; stopMicrophone(); }
    else { myActiveSlot = slotId; await startMicrophone(); }
    window.syncState();
}

/**
 * ÁUDIO E UTILITÁRIOS
 */
async function startMicrophone() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMicMuted = false;
        initVUMeter(localStream);
        updateMicUI();
    } catch (e) { alert("Erro mic"); myActiveSlot = null; }
}

function stopMicrophone() {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    isMicMuted = true; updateMicUI();
}

window.toggleMic = () => {
    if (!myActiveSlot) return;
    isMicMuted = !isMicMuted;
    localStream.getAudioTracks()[0].enabled = !isMicMuted;
    updateMicUI(); window.syncState();
};

function updateMicUI() {
    const b = document.getElementById('btn-mic-toggle');
    b.className = isMicMuted ? "btn-mic" : "btn-mic active";
}

function initVUMeter(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    const anim = () => {
        if (!myActiveSlot || isMicMuted) return;
        analyser.getByteFrequencyData(dataArray);
        const v = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const el = document.getElementById(`slot-${myActiveSlot}`);
        if (el && v > 15) {
            el.style.transform = `scale(${1 + v/200})`;
            const col = el.classList.contains('rank-owner') ? '255,204,0' : '0,242,255';
            el.style.boxShadow = `0 0 ${v}px rgba(${col}, 0.8)`;
        } else if (el) { el.style.transform = "scale(1)"; el.style.boxShadow = "none"; }
        requestAnimationFrame(anim);
    };
    anim();
}

function showSection(name) {
    Object.values(ui).forEach(s => s?.classList?.add?.('hidden'));
    ui[name].classList.remove('hidden');
}

document.getElementById('btn-age-yes').onclick = () => showSection('auth');
document.getElementById('btn-login').onclick = async () => {
    const { error } = await nexusClient.auth.signInWithPassword({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value });
    if (error) alert(error.message);
};
document.getElementById('btn-register').onclick = async () => {
    const { error } = await nexusClient.auth.signUp({ email: document.getElementById('reg-email').value, password: document.getElementById('reg-password').value });
    if (error) alert(error.message);
};
document.getElementById('btn-save-setup').onclick = async () => {
    const upd = { custom_id: document.getElementById('setup-nickname').value, avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed="+Math.random(), profile_bio: document.getElementById('setup-bio').value };
    const { data: { user } } = await nexusClient.auth.getUser();
    await nexusClient.from('profiles').update(upd).eq('id', user.id);
    location.reload();
};
window.shareInvite = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${currentRoomId}`); alert("COPIADO!"); };

init();
