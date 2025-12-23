import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authTitle: document.getElementById('auth-title')
};

// Função de Inicialização
async function initApp() {
    console.log("Nexus: Motor iniciado.");

    try {
        // Verifica se há uma sessão ativa usando o cliente renomeado
        const { data: { session }, error } = await nexusClient.auth.getSession();

        if (error) throw error;

        // Remove a tela de carregamento
        if (ui.loading) ui.loading.classList.add('hidden');

        if (session) {
            console.log("Nexus: Usuário detectado.");
            ui.app.classList.remove('hidden');
            ui.auth.classList.add('hidden');
        } else {
            console.log("Nexus: Nenhum usuário logado.");
            ui.auth.classList.remove('hidden');
            ui.app.classList.add('hidden');
        }
    } catch (err) {
        console.error("Erro na inicialização Nexus:", err.message);
        if (ui.loading) ui.loading.classList.add('hidden');
        ui.auth.classList.remove('hidden');
    }
}

// Lógica de Login
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    
    if (error) {
        alert("Erro no acesso: " + error.message);
    } else {
        location.reload();
    }
});

// Lógica de Cadastro
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;

    const { error } = await nexusClient.auth.signUp({ 
        email, 
        password: pass,
        options: { data: { display_name: user } }
    });

    if (error) {
        alert("Erro no cadastro: " + error.message);
    } else {
        alert("Conta criada com sucesso! Verifique seu e-mail.");
        window.toggleAuth();
    }
});

// Lógica de Logout
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

// Alternar entre Login e Cadastro
window.toggleAuth = () => {
    const isLoginVisible = !ui.loginForm.classList.contains('hidden');
    
    if (isLoginVisible) {
        ui.loginForm.classList.add('hidden');
        ui.registerForm.classList.remove('hidden');
        ui.authTitle.innerText = "Criar Conta Nexus";
    } else {
        ui.loginForm.classList.remove('hidden');
        ui.registerForm.classList.add('hidden');
        ui.authTitle.innerText = "Entrar no Nexus";
    }
};

// Dispara a inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}