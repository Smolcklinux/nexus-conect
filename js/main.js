import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    age: document.getElementById('age-section'),
    auth: document.getElementById('auth-section'),
    setup: document.getElementById('setup-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form')
};

let audioCtx, analyser, dataArray, source;
const selectedInterests = new Set();

// 1. INICIALIZAÇÃO
async function initApp() {
    ui.loading?.classList.add('hidden');
}

// 2. EQUALIZADOR DE VOZ (Visualização Dinâmica)
async function startVisualizer() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 32;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const bars = document.querySelectorAll('.bar');
        
        function render() {
            requestAnimationFrame(render);
            analyser.getByteFrequencyData(dataArray);
            bars.forEach((bar, i) => {
                const val = (dataArray[i] / 255) * 100;
                bar.style.height = `${Math.max(10, val)}%`;
                // Brilho dinâmico conforme a voz
                bar.style.boxShadow = `0 0 ${val/5}px var(--cyan-neon)`;
            });
        }
        render();
    } catch (e) { 
        console.error("Acesso ao microfone negado ou erro no AudioContext:", e); 
    }
}

// 3. PRESENÇA EM TEMPO REAL (Sala de Voz)
function enterStage(profile) {
    const channel = nexusClient.channel('stage-01', {
        config: { presence: { key: profile.id } }
    });
    
    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            updateStageUI(state);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    id: profile.id,
                    nick: profile.custom_id || 'Nexus User',
                    avatar: profile.avatar_url
                });
            }
        });
}

function updateStageUI(state) {
    const grid = document.getElementById('stage-users');
    const count = document.getElementById('room-count');
    if(!grid) return;

    grid.innerHTML = '';
    const users = Object.values(state);
    count.innerText = `${users.length} ONLINE`;
    
    users.forEach(u => {
        const user = u[0];
        grid.innerHTML += `
            <div class="user-node">
                <img src="${user.avatar}" class="node-img">
                <span style="font-size: 10px; color: #fff; margin-top:5px;">${user.nick}</span>
            </div>
        `;
    });
}

// 4. LOGICA DE AUTH & SETUP
document.getElementById('btn-age-yes')?.addEventListener('click', () => {
    ui.age.classList.add('hidden');
    ui.auth.classList.remove('hidden');
});

document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    ui.loading.classList.remove('hidden');
    const { data, error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
        ui.loading.classList.add('hidden');
        return alert("Erro: " + error.message);
    }
    
    const { data: profile } = await nexusClient.from('profiles').select('*').eq('id', data.session.user.id).single();
    
    ui.loading.classList.add('hidden');
    ui.auth.classList.add('hidden');
    ui.app.classList.remove('hidden');
    
    enterStage(profile);
    startVisualizer();
});

document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;

    ui.loading.classList.remove('hidden');
    const { error } = await nexusClient.auth.signUp({ 
        email, 
        password: pass, 
        options: { data: { display_name: user } } 
    });

    ui.loading.classList.add('hidden');
    if (error) return alert(error.message);

    document.getElementById('setup-nickname').value = user;
    ui.auth.classList.add('hidden');
    ui.setup.classList.remove('hidden');
});

// 5. UPLOAD DE IMAGEM PARA O STORAGE
document.getElementById('file-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    ui.loading.classList.remove('hidden');
    try {
        const { data: { session } } = await nexusClient.auth.getSession();
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await nexusClient.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = nexusClient.storage
            .from('avatars')
            .getPublicUrl(filePath);

        document.getElementById('main-avatar-preview').src = publicUrl;
        document.getElementById('selected-avatar-url').value = publicUrl;
        
        // Desmarca avatares padrão se subiu um personalizado
        document.querySelectorAll('.avatar-opt').forEach(i => i.classList.remove('selected'));
        
    } catch (err) {
        alert("Erro no upload: " + err.message);
    } finally {
        ui.loading.classList.add('hidden');
    }
});

// 6. TAGS DE INTERESSE (Lógica funcional)
document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const val = tag.dataset.value;
        if (selectedInterests.has(val)) {
            selectedInterests.delete(val);
            tag.classList.remove('active');
        } else {
            selectedInterests.add(val);
            tag.classList.add('active');
        }
    });
});

// 7. FINALIZAR SETUP
document.getElementById('btn-save-setup')?.addEventListener('click', async () => {
    ui.loading.classList.remove('hidden');
    const { data: { session } } = await nexusClient.auth.getSession();
    
    const updates = {
        custom_id: document.getElementById('setup-nickname').value,
        profile_bio: document.getElementById('setup-bio').value || '',
        avatar_url: document.getElementById('selected-avatar-url').value,
        interests: Array.from(selectedInterests)
    };

    const { error } = await nexusClient.from('profiles').update(updates).eq('id', session.user.id);
    
    if (error) {
        ui.loading.classList.add('hidden');
        return alert("Erro ao salvar perfil: " + error.message);
    }

    location.reload(); // Recarrega para entrar na sala logado
});

// 8. LOGOUT
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

// LISTENERS DE AVATARES PADRÃO
document.querySelectorAll('.avatar-opt').forEach(img => {
    img.addEventListener('click', () => {
        document.querySelectorAll('.avatar-opt').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        document.getElementById('main-avatar-preview').src = img.dataset.url;
        document.getElementById('selected-avatar-url').value = img.dataset.url;
    });
});

window.toggleAuth = () => {
    ui.loginForm.classList.toggle('hidden');
    ui.registerForm.classList.toggle('hidden');
};

initApp();
