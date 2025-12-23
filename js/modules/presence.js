import { supabase } from '../config.js';

export const Presence = {
    // Calcula o tempo relativo
    formatTime(lastSeen) {
        const diff = Math.floor((new Date() - new Date(lastSeen)) / 60000);
        if (diff < 1) return '<span class="online">● Online</span>';
        if (diff < 60) return `Visto há ${diff}m`;
        return `Visto há ${Math.floor(diff/60)}h`;
    },

    // Função "Ir para a festa"
    async joinFriend(friendId) {
        const { data: friend } = await supabase.from('profiles')
            .select('current_room_id, rooms(*)').eq('id', friendId).single();

        if (!friend.current_room_id) return alert("Amigo está offline.");

        if (friend.rooms.is_private) {
            const pass = prompt("Sala Privada. Senha:");
            if (pass !== friend.rooms.password) return alert("Senha incorreta!");
        }
        
        // Lógica para carregar a sala...
        console.log("Entrando na sala:", friend.current_room_id);
    }
};
