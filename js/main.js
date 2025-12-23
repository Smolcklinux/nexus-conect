import { supabase } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authTitle: document.getElementById('auth-title')
};

// INICIALIZAÇÃO DIRETA
async function init() {
    console.log("Nexus: Iniciando sem travas de segurança externa.");
    
    // Verifica apenas se o usuário já está logado no Supabase
    const { data: { session } } = await supabase.auth.getSession();

    ui.loading.classList.add('hidden'); // Remove o loading na hora

    if (session) {
        ui.app.classList.remove('hidden');
    } else {
        ui.auth.classList.remove('hidden');
    }
}

// LOGIN
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) alert("Erro: " + error.message);
    else location.reload();
});

// CADASTRO
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;

    const { error } = await supabase.auth.signUp({ 
        email, 
        password: pass,
        options: { data: { username: user } }
    });

    if (error) alert("Erro: " + error.message);
    else alert("Conta criada! Verifique seu e-mail.");
});

// SAIR
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
});

// ALTERNAR TELAS
window.toggleAuth = () => {
    ui.loginForm.classList.toggle('hidden');
    ui.registerForm.classList.toggle('hidden');
    ui.authTitle.innerText = ui.loginForm.classList.contains('hidden') ? "Criar Conta" : "Entrar no Nexus";
};

document.addEventListener('DOMContentLoaded', init);
