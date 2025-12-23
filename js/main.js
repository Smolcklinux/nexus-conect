import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form')
};

// Função de Inicialização
async function initApp() {
    console.log("Nexus: Motor iniciado.");

    try {
        const { data: { session }, error } = await nexusClient.auth.getSession();
        if (error) throw error;

        if (ui.loading) ui.loading.classList.add('hidden');

        if (session) {
            console.log("Nexus: Usuário detectado.");
            ui.app?.classList.remove('hidden');
            ui.auth?.classList.add('hidden');
        } else {
            console.log("Nexus: Nenhum usuário logado.");
            ui.auth?.classList.remove('hidden');
            ui.app?.classList.add('hidden');
        }
    } catch (err) {
        console.error("Erro na inicialização Nexus:", err.message);
        if (ui.loading) ui.loading.classList.add('hidden');
        ui.auth?.classList.remove('hidden');
    }
}

// Lógica de Login
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if(!email || !pass) return alert("Preencha todos os campos!");

    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    
    if (error) alert("Erro no acesso: " + error.message);
    else location.reload();
});

// Lógica de Cadastro
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;

    if(!email || !pass || !user) return alert("Preencha todos os campos!");

    const { error } = await nexusClient.auth.signUp({ 
        email, 
        password: pass,
        options: { data: { display_name: user } }
    });

    if (error) alert("Erro no cadastro: " + error.message);
    else {
        alert("Conta criada! Verifique seu e-mail para confirmar.");
        window.toggleAuth();
    }
});

// Lógica de Logout
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

// Alternar entre Login e Cadastro (Ajustado para o novo design)
window.toggleAuth = () => {
    // Verifica se o formulário de login está visível
    const isLoginVisible = !ui.loginForm.classList.contains('hidden');
    
    if (isLoginVisible) {
        ui.loginForm.classList.add('hidden');
        ui.registerForm.classList.remove('hidden');
    } else {
        ui.loginForm.classList.remove('hidden');
        ui.registerForm.classList.add('hidden');
    }
};

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
