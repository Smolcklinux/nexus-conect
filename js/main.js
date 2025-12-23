import { supabase, NEXUS_CONFIG } from './config.js';
import { Auth } from './modules/auth.js';
import { Security } from './modules/security.js';

// Elementos da Interface
const ui = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authTitle: document.getElementById('auth-title')
};

/**
 * Inicialização do App
 */
async function init() {
    try {
        // 1. Verificação de Banimento por Hardware (IP/MAC)
        const isBanned = await Security.checkHardwareBan();
        if (isBanned) {
            window.location.href = 'banned.html';
            return;
        }

        // 2. Verificar Sessão
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            showApp();
        } else {
            showAuth();
        }
    } catch (err) {
        console.error("Erro na inicialização:", err);
        showAuth(); // Fallback para login se algo falhar
    }
}

// Alternar Telas
function showAuth() {
    ui.loading.classList.add('hidden');
    ui.app.classList.add('hidden');
    ui.auth.classList.remove('hidden');
}

function showApp() {
    ui.loading.classList.add('hidden');
    ui.auth.classList.add('hidden');
    ui.app.classList.remove('hidden');
    // Iniciar funções do chat aqui...
}

/**
 * LÓGICA DE LOGIN
 */
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
        await Auth.signIn(email, pass);
        showApp();
    } catch (error) {
        alert("Erro no acesso: " + error.message);
    }
});

/**
 * LÓGICA DE REGISTRO
 */
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const user = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;

    try {
        await Auth.signUp(email, pass, user);
        alert("Conta criada! Verifique seu e-mail ou faça login.");
        toggleAuth();
    } catch (error) {
        alert("Erro ao cadastrar: " + error.message);
    }
});

/**
 * SAIR DO SISTEMA
 */
window.handleLogout = async () => {
    await Auth.signOut();
    location.reload();
};

// Tornar o toggleAuth acessível pelo HTML
window.toggleAuth = () => {
    ui.loginForm.classList.toggle('hidden');
    ui.registerForm.classList.toggle('hidden');
    ui.authTitle.innerText = ui.loginForm.classList.contains('hidden') 
        ? "Criar Conta Nexus" 
        : "Entrar no Nexus";
};

// Iniciar tudo
document.addEventListener('DOMContentLoaded', init);
