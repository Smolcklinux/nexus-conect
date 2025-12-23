import { supabase } from '../config.js';
import { Security } from './security.js';

export const Chat = {
    lastMessageTime: 0,
    cooldown: 2000, // 2 segundos base

    /**
     * Inicializa a escuta de mensagens em tempo real (Realtime)
     */
    initRealtime(roomId, callback) {
        return supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, payload => {
                callback(payload.new);
            })
            .subscribe();
    },

    /**
     * Envia uma mensagem com proteções de segurança
     */
    async sendMessage(userId, roomId, text) {
        const now = Date.now();
        
        // 1. Verificação de Flood (Rate Limit)
        // Buscamos o cargo para dar privilégios de velocidade à Staff/VIP
        const { data: profile } = await supabase.from('profiles')
            .select('role, vip_level').eq('id', userId).single();

        const userCooldown = (profile.role === 'owner' || profile.vip_level >= 50) ? 500 : this.cooldown;

        if (now - this.lastMessageTime < userCooldown) {
            console.warn("Flood detectado");
            return { error: "Aguarde para enviar outra mensagem." };
        }

        // 2. Sanitização contra Inject (XSS)
        const cleanText = Security.sanitize(text);

        if (cleanText.trim().length === 0) return;

        // 3. Inserção no Banco
        const { data, error } = await supabase.from('messages').insert([
            {
                user_id: userId,
                room_id: roomId,
                text: cleanText,
                created_at: new Date().toISOString()
            }
        ]);

        if (!error) {
            this.lastMessageTime = now;
            // Opcional: Dar 1 moeda por mensagem enviada (incentivo)
            await supabase.rpc('increment_coins', { user_id: userId, amount: 1 });
        }

        return { data, error };
    },

    /**
     * Carrega o histórico de mensagens da sala
     */
    async loadHistory(roomId, limit = 50) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                id, text, created_at,
                profiles (username, role, vip_level)
            `)
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(limit);

        return data || [];
    },

    /**
     * Sistema de Comandos de Chat (Ex: /limpar, /ban)
     */
    async handleCommands(text, userRole) {
        if (!text.startsWith('/')) return false;

        const args = text.split(' ');
        const command = args[0].toLowerCase();

        if (command === '/limpar' && (userRole === 'owner' || userRole === 'adm')) {
            // Lógica para limpar o ecrã localmente
            document.getElementById('messages').innerHTML = '';
            return true;
        }

        if (command === '/moedas' && userRole === 'owner') {
            const target = args[1];
            const amount = parseInt(args[2]);
            await supabase.rpc('add_coins_secure', { user_id: target, amount: amount });
            alert(`Enviado ${amount} moedas para ${target}`);
            return true;
        }

        return false;
    }
};
