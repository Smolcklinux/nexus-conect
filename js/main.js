import { nexusClient } from './config.js';

const ui = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form')
};

/**
 * INICIALIZAÇÃO DO APP
 */
async function initApp() {
    console.log("🟢 Nexus: Motor iniciado.");

    try {
        const { data: { session }, error } = await nexusClient.auth.getSession();
        if (error) throw error;

        if (session) {
            // VERIFICAÇÃO DE BANIMENTO (Baseado no seu SQL)
            const { data: profile, error: profileErr } = await nexusClient
                .from('profiles')
                .select('banned_until, ban_reason')
                .eq('id', session.user.id)
                .single();

            if (profile && profile.banned_until && new Date(profile.banned_until) > new Date()) {
                alert(`🚫 ACESSO NEGADO\nMotivo: ${profile.ban_reason || 'Violação dos termos'}\nAté: ${new Date(profile.banned_until).toLocaleString()}`);
                await nexusClient.auth.signOut();
                location.reload();
                return;
            }

            console.log("✅ Nexus: Usuário Autenticado.");
            ui.app?.classList.remove('hidden');
            ui.auth?.classList.add('hidden');
        } else {
            ui.auth?.classList.remove('hidden');
            ui.app?.classList.add('hidden');
        }
    } catch (err) {
        console.error("❌ Erro Nexus:", err.message);
        ui.auth?.classList.remove('hidden');
    } finally {
        if (ui.loading) ui.loading.classList.add('hidden');
    }
}

/**
 * LÓGICA DE LOGIN
 */
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!email || !pass) return alert("Preencha todos os campos!");

    const { error } = await nexusClient.auth.signInWithPassword({ email, password: pass });
    
    if (error) alert("Erro no acesso: " + error.message);
    else location.reload();
});

/**
 * LÓGICA DE CADASTRO (Cria perfil via Trigger SQL)
 */
document.getElementById('btn-register')?.addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const user = document.getElementById('reg-username').value.trim();

    if (!email || !pass || !user) return alert("Preencha todos os campos!");

    // Tenta obter o IP para o seu log de segurança do SQL
    let userIp = "0.0.0.0";
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIp = data.ip;
    } catch(e) { console.log("Não foi possível obter o IP"); }

    const { error } = await nexusClient.auth.signUp({ 
        email, 
        password: pass,
        options: { 
            data: { 
                display_name: user,
                registration_ip: userIp 
            } 
        }
    });

    if (error) {
        alert("Erro no cadastro: " + error.message);
    } else {
        alert("🎉 Conta criada no Nexus! Verifique seu e-mail para ativar.");
        window.toggleAuth();
    }
});

/**
 * LOGOUT
 */
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await nexusClient.auth.signOut();
    location.reload();
});

/**
 * ALTERNAR TELAS (Toggle)
 */
window.toggleAuth = () => {
    ui.loginForm?.classList.toggle('hidden');
    ui.registerForm?.classList.toggle('hidden');
};

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
