import { supabase } from '../config.js';

export const AdminActions = {
    /**
     * Aplica uma punição ao usuário
     * @param {string} targetId - ID do usuário alvo
     * @param {string} duration - 'kick', '24h', '36h', '72h', '7d', '14d', '30d', '120d', 'perm'
     * @param {string} type - 'normal' (conta) ou 'mac' (hardware/IP)
     * @param {string} reason - Motivo da punição
     */
    async punish(targetId, duration, type, reason) {
        if (!reason || reason.length < 5) {
            return alert("Erro: Insira um motivo detalhado para o banimento.");
        }

        const { data: { user: admin } } = await supabase.auth.getUser();
        
        // 1. Calcular Data de Desbloqueio
        let unlockDate = new Date();
        const now = new Date();

        switch (duration) {
            case 'kick': unlockDate = null; break;
            case '24h':  unlockDate.setHours(now.getHours() + 24); break;
            case '36h':  unlockDate.setHours(now.getHours() + 36); break;
            case '72h':  unlockDate.setHours(now.getHours() + 72); break;
            case '7d':   unlockDate.setDate(now.getDate() + 7); break;
            case '14d':  unlockDate.setDate(now.getDate() + 14); break;
            case '30d':  unlockDate.setDate(now.getDate() + 30); break;
            case '120d': unlockDate.setDate(now.getDate() + 120); break;
            case 'perm': unlockDate = new Date('9999-12-31T23:59:59'); break;
        }

        // 2. Lógica de KICK (Apenas expulsar da sala)
        if (duration === 'kick') {
            await supabase.from('profiles').update({ current_room_id: null }).eq('id', targetId);
            alert("Usuário expulso da sala com sucesso!");
            return;
        }

        // 3. Banimento por CONTA
        const { error: accError } = await supabase.from('profiles').update({
            banned_until: unlockDate.toISOString(),
            ban_reason: reason
        }).eq('id', targetId);

        if (accError) return alert("Erro ao banir conta.");

        // 4. Banimento por IP/MAC (Se selecionado)
        if (type === 'mac') {
            const { data: target } = await supabase.from('profiles')
                .select('last_ip, last_mac')
                .eq('id', targetId).single();

            if (target.last_ip) {
                await supabase.from('blacklist_network').insert([
                    { network_value: target.last_ip, type: 'IP', reason: reason },
                    { network_value: target.last_mac, type: 'MAC', reason: reason }
                ]);
            }
        }

        // 5. Registrar no Log de Auditoria
        await supabase.from('security_logs').insert({
            user_id: targetId,
            action_type: `BAN_${duration.toUpperCase()}_${type.toUpperCase()}`,
            details: `Admin ${admin.id} baniu por: ${reason}`,
            severity: 'high'
        });

        alert(`Punição de ${duration} aplicada com sucesso!`);
    },

    /**
     * Remove todos os banimentos de um usuário (Unban)
     */
    async unban(targetId) {
        const { data: target } = await supabase.from('profiles')
            .select('last_ip, last_mac')
            .eq('id', targetId).single();

        // Limpa a conta
        await supabase.from('profiles').update({
            banned_until: null,
            ban_reason: null
        }).eq('id', targetId);

        // Limpa a blacklist de rede
        if (target.last_ip || target.last_mac) {
            await supabase.from('blacklist_network')
                .delete()
                .or(`network_value.eq.${target.last_ip},network_value.eq.${target.last_mac}`);
        }

        alert("Usuário desbanido completamente!");
    }
};
