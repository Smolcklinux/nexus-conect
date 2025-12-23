import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    home: document.getElementById('home-nebula'),
    app: document.getElementById('app-section'),
    auth: document.getElementById('auth-section'),
    setup: document.getElementById('setup-section'),
    nebulaContainer: document.getElementById('online-users-container'),
    voiceStage: document.getElementById('voice-stage-slots'),
    profileModal: document.getElementById('profile-modal'),
    chatModal: document.getElementById('chat-modal')
};

let currentPresence = {};
let myActiveSlot = null;
let activeChatPartner = null;

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    nexusClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const { data: p } = await nexusClient.from('profiles').select('*').eq('id', session.user.id).single();
            if (!p?.custom_id) return showSection('setup');
            
            if (roomId) {
                showSection('app');
                startVoiceRoom(roomId, session.user.id, p);
            } else {
                showSection('home');
                startNebula(session.user.id, p);
            }
        } else {
            showSection('auth');
        }
        ui.loading.classList.add('hidden');
    });
}

// --- NEBULOSA ---
function startNebula(userId, profile) {
    const channel = nexusClient.channel('nebula_main');
    channel.on('presence', { event: 'sync' }, () => {
        ui.nebulaContainer.innerHTML = '';
        Object.values(channel.presenceState()).flat().forEach(u => {
            const bubble = document.createElement('div');
            bubble.className = 'user-bubble';
            bubble.style.left = `${Math.random() * 80 + 5}%`;
            bubble.style.top = `${Math.random() * 70 + 10}%`;
            bubble.innerHTML = `<img src="${u.avatar}">`;
            bubble.onclick = () => openProfile(u);
            ui.nebulaContainer.appendChild(bubble);
        });
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({ id: userId, nick: profile.custom_id, avatar: profile.avatar_url, bio: profile.profile_bio });
        }
    });
}

// --- SALA DE VOZ ---
async function startVoiceRoom(roomId, userId, profile) {
    document.getElementById('display-room-id').innerText = roomId;
    const channel = nexusClient.channel(`room_${roomId}`, { config: { presence: { key: userId } } });
    
    channel.on('presence', { event: 'sync' }, () => {
        currentPresence = channel.presenceState();
        renderSlots(currentPresence);
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({ id: userId, nick: profile.custom_id, avatar: profile.avatar_url, slot: myActiveSlot });
        }
    });
}

function renderSlots(state) {
    document.querySelectorAll('.slot').forEach(s => { s.innerHTML = '';
        s.className = 'slot'; });
    Object.values(state).flat().forEach(u => {
        if (u.slot !== null) {
            const el = document.getElementById(`slot-${u.slot}`);
            if (el) {
                el.innerHTML = `<img src="${u.avatar}">`;
                el.classList.add('occupied');
            }
        }
    });
}

// --- AÇÕES ---
document.getElementById('btn-create-room-trigger')?.addEventListener('click', async () => {
    const name = prompt("Nome da Sala:");
    if (!name) return;
    const { data: { user } } = await nexusClient.auth.getUser();
    const roomId = `${Math.floor(100+Math.random()*899)}-${Math.floor(100+Math.random()*899)}`;
    await nexusClient.from('rooms').insert([{ id: roomId, owner_id: user.id, title: name }]);
    window.location.search = `?room=${roomId}`;
});

document.getElementById('btn-leave-room')?.addEventListener('click', () => {
    window.location.search = '';
});

function openProfile(user) {
    document.getElementById('p-card-nick').innerText = `@${user.nick}`;
    document.getElementById('p-card-avatar').src = user.avatar;
    document.getElementById('p-card-bio').innerText = user.bio || "...";
    ui.profileModal.classList.remove('hidden');
    activeChatPartner = user;
}

function showSection(name) {
    ['auth', 'setup', 'home', 'app'].forEach(s => ui[s]?.classList.add('hidden'));
    ui[name]?.classList.remove('hidden');
}

init();