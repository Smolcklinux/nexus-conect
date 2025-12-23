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
    loginForm: document.getElementById('login-form'),
    regForm: document.getElementById('register-form'),
    profileModal: document.getElementById('profile-modal')
};

let currentRoomId = null;
let nebulaChannel = null;

// --- INICIALIZAÇÃO DIRETA ---
async function init() {
    // 1. Esconde loading se houver erro crítico
    const timeout = setTimeout(() => {
        if (ui.loading) ui.loading.classList.add('hidden');
    }, 4000);

    nexusClient.auth.onAuthStateChange(async (event, session) => {
        clearTimeout(timeout);
        
        if (session) {
            const { data: p, error } = await nexusClient
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!p || !p.custom_id) {
                showSection('setup');
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                const inviteId = urlParams.get('room');
                
                if (inviteId) {
                    enterRoom(session.user.id, inviteId, p);
                } else {
                    startNebula(session.user.id, p);
                }
            }
        } else {
            const ageVerified = localStorage.getItem('nexus_age_verified');
            showSection(ageVerified ? 'auth' : 'age');
        }
        
        if (ui.loading) ui.loading.classList.add('hidden');
    });
}

// --- FLUXO NEBULOSA ---
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
            bubble.style.left = `${Math.random() * 80 + 10}%`;
            bubble.style.top = `${Math.random() * 70 + 15}%`;
            bubble.innerHTML = `<img src="${u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.nick}">`;
            bubble.onclick = () => openProfile(u);
            ui.nebulaContainer.appendChild(bubble);
        });
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await nebulaChannel.track({
                id: userId,
                nick: profile.custom_id,
                avatar: profile.avatar_url,
                bio: profile.profile_bio
            });
        }
    });
}

// --- ENTRAR NA SALA ---
async function enterRoom(userId, roomId, profile) {
    currentRoomId = roomId;
    if (ui.roomIdDisplay) ui.roomIdDisplay.innerText = roomId;
    showSection('app');
    // Aqui viria a lógica de slots que já temos
}

// --- EVENTOS DE CADASTRO E LOGIN (SEM EMOJIS) ---

// Alternar Telas
document.getElementById('go-to-register')?.addEventListener('click', () => {
    ui.loginForm.classList.add('hidden');
    ui.regForm.classList.remove('hidden');
});

document.getElementById('go-to-login')?.addEventListener('click', () => {
    ui.regForm.classList.add('hidden');
    ui.loginForm.classList.remove('hidden');
});

// Registrar
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const nick = document.getElementById('reg-username').value;

    if (!email || !pass || !nick) return alert("PREENCHA TUDO");

    ui.loading.classList.remove('hidden');
    const { data, error } = await nexusClient.auth.signUp({ email, password: pass });

    if (error) {
        alert("ERRO: " + error.message);
    } else if (data.user) {
        await nexusClient.from('profiles').insert([{
            id: data.user.id,
            custom_id: nick,
            profile_bio: 'EXPLORANDO O NEXUS...',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nick}`
        }]);
        alert("CONTA CRIADA COM SUCESSO");
        location.reload();
    }
    ui.loading.classList.add('hidden');
});

// Login
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    ui.loading.classList.remove('hidden');
    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    if (error) alert("DADOS INCORRETOS");
    ui.loading.classList.add('hidden');
});

// Ver Senha (Texto)
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.textContent = 'VER';
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-target'));
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = 'OCULTAR';
        } else {
            input.type = 'password';
            btn.textContent = 'VER';
        }
    });
});

// Idade
document.getElementById('btn-age-yes')?.addEventListener('click', () => {
    localStorage.setItem('nexus_age_verified', 'true');
    showSection('auth');
});

function openProfile(user) {
    document.getElementById('p-card-avatar').src = user.avatar;
    document.getElementById('p-card-nick').innerText = `@${user.nick}`;
    ui.profileModal.classList.remove('hidden');
}

function showSection(name) {
    [ui.age, ui.auth, ui.setup, ui.home, ui.app].forEach(s => s?.classList.add('hidden'));
    if (ui[name]) ui[name].classList.remove('hidden');
}

init();
