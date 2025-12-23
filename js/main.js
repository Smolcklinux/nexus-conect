import { nexusClient } from './config.js';

// Seletores de UI
const ui = {
    loading: document.getElementById('loading-screen'),
    age: document.getElementById('age-section'),
    auth: document.getElementById('auth-section'),
    setup: document.getElementById('setup-section'),
    app: document.getElementById('app-section'),
    roomIdDisplay: document.getElementById('display-room-id')
};

// Variáveis de Estado
let myActiveSlot = null;
let isMicMuted = true;
let localStream = null;
let currentRoomId = null;
let audioCtx, analyser, dataArray;

/**
 * 1. INICIALIZAÇÃO E CONTROLE DE SALAS
 */
async function init() {
    ui.loading.classList.add('hidden');
    
    // Verifica se veio por convite
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('room');
    
    // Escuta mudanças de auth
    nexusClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const { data: profile } = await nexusClient.from('profiles').select('*').eq('id', session.user.id).single();
            if (!profile.custom_id) {
                showSection('setup');
            } else {
                handleRoomEntry(session.user.id, inviteId);
            }
        }
    });
}

async function handleRoomEntry(userId, inviteId) {
    if (inviteId) {
        currentRoomId = inviteId;
    } else {
        // Tenta buscar a sala do usuário (Dono)
        let { data: room } = await nexusClient.from('rooms').select('*').eq('owner_id', userId).maybeSingle();
        if (!room) {
            const { data: newRoom } = await nexusClient.from('rooms').insert([{ owner_id: userId, room_name: "NEXUS STAGE" }]).select().single();
            room = newRoom;
        }
        currentRoomId = room.id;
    }
    
    ui.roomIdDisplay.innerText = currentRoomId.substring(0, 8);
    showSection('app');
    setupPresence(userId);
}

/**
 * 2. SISTEMA DE CADEIRAS E PRESENÇA
 */
function setupPresence(userId) {
    const channel = nexusClient.channel(`room_${currentRoomId}`, {
        config: { presence: { key: userId } }
    });

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            renderSlots(state);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                const { data: prof } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
                updateTrack(channel, prof);
            }
        });

    // Função global para atualizar o estado no Realtime
    window.syncState = async () => {
        const { data: prof } = await nexusClient.from('profiles').select('*').eq('id', userId).single();
        await channel.track({
            id: userId,
            nick: prof.custom_id,
            avatar: prof.avatar_url,
            slot: myActiveSlot,
            muted: isMicMuted
        });
    };
}

function renderSlots(state) {
    // Reseta visual dos slots
    document.querySelectorAll('.slot').forEach(s => {
        s.innerHTML = '';
        s.classList.remove('occupied', 'speaking');
    });

    const users = Object.values(state);
    document.getElementById('room-count').innerText = `${users.length} ONLINE`;

    users.forEach(presence => {
        const u = presence[0];
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.classList.add('occupied');
                el.innerHTML = `<img src="${u.avatar}">`;
                if (!u.muted) el.classList.add('speaking');
            }
        }
    });
}

/**
 * 3. CONTROLE DE MICROFONE E ÁUDIO
 */
window.handleSeatAction = async (slotId) => {
    if (myActiveSlot === slotId) {
        myActiveSlot = null;
        stopMicrophone();
    } else {
        myActiveSlot = slotId;
        await startMicrophone();
    }
    window.syncState();
};

async function startMicrophone() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMicMuted = false;
        initVUMeter(localStream);
        updateMicUI();
    } catch (e) {
        alert("Erro ao acessar microfone.");
        myActiveSlot = null;
    }
}

function stopMicrophone() {
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }
    isMicMuted = true;
    updateMicUI();
}

window.toggleMic = () => {
    if (!myActiveSlot) return alert("Sente-se primeiro!");
    isMicMuted = !isMicMuted;
    localStream.getAudioTracks()[0].enabled = !isMicMuted;
    updateMicUI();
    window.syncState();
};

function updateMicUI() {
    const btn = document.getElementById('btn-mic-toggle');
    if (isMicMuted) {
        btn.classList.remove('active');
        btn.innerText = "MIC OFF";
    } else {
        btn.classList.add('active');
        btn.innerText = "MIC ON";
    }
}

/**
 * 4. VUMETER (PULSAÇÃO VISUAL)
 */
function initVUMeter(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    function animate() {
        if (!myActiveSlot || isMicMuted) return;
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        const el = document.getElementById(`slot-${myActiveSlot}`);
        if (el && volume > 15) {
            el.style.transform = `scale(${1 + volume/200})`;
            el.style.boxShadow = `0 0 ${volume}px var(--cyan-neon)`;
        } else if (el) {
            el.style.transform = `scale(1)`;
            el.style.boxShadow = `none`;
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/**
 * 5. AUXILIARES E EVENTOS
 */
function showSection(name) {
    Object.values(ui).forEach(s => s?.classList?.add('hidden'));
    ui[name].classList.remove('hidden');
}

window.shareInvite = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    navigator.clipboard.writeText(link);
    alert("LINK DE CONVITE COPIADO!");
};

// Eventos de Botões
document.getElementById('btn-age-yes').onclick = () => showSection('auth');

document.getElementById('btn-login').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message);
};

document.getElementById('btn-register').onclick = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const { error } = await nexusClient.auth.signUp({ email, password: pass });
    if (error) alert(error.message);
};

document.getElementById('btn-logout-nexus').onclick = () => {
    nexusClient.auth.signOut();
    location.reload();
};

init();
