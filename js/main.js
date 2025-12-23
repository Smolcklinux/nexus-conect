import { supabase } from './config.js';
import { Security } from './modules/security.js';

async function bootstrap() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    try {
        // 1. Captura Dados de Rede Silenciosamente
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();
        const mac = await Security.getFingerprint();

        // 2. Busca Perfil no Banco
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        // 3. Verificação de Staff (Exceção às regras de limite)
        const isStaff = ['owner', 'adm'].includes(profile.role);

        if (!isStaff) {
            // A. Verificação de Banimento (IP/MAC ou Conta)
            const { data: isBlacklisted } = await supabase.from('blacklist_network')
                .select('*').or(`network_value.eq.${ip},network_value.eq.${mac}`).single();

            const isBanned = profile.banned_until && new Date(profile.banned_until) > new Date();

            if (isBlacklisted || isBanned) {
                renderBanScreen(isBlacklisted?.reason || profile.ban_reason);
                return;
            }

            // B. Trava de 5 Contas Máximo
            const { count } = await supabase.from('profiles')
                .select('*', { count: 'exact', head: true })
                .or(`last_ip.eq.${ip},last_mac.eq.${mac}`);

            if (count > 5) {
                renderLimitScreen();
                return;
            }
        }

        // 4. Atualiza Logs e Inicia App
        await supabase.from('profiles').update({ last_ip: ip, last_mac: mac }).eq('id', user.id);
        Security.initAntiInspect(profile.role);
        startNexusApp(); // Carrega a interface real

    } catch (err) {
        console.error("Erro Crítico de Segurança:", err);
    }
}

function renderBanScreen(reason) {
    document.getElementById('app-container').innerHTML = `
        <div class="ban-screen">
            <h1>🚫 CONTA BLOQUEADA</h1>
            <p>Motivo: <strong>${reason}</strong></p>
            <a href="https://suporte.nexus.com" class="btn">Recorrer</a>
        </div>`;
}

bootstrap();
