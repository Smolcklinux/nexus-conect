import { supabase } from '../config.js';
import { Security } from './security.js';

export const Auth = {
    /**
     * Realiza o cadastro de um novo usuário com trava de segurança
     */
    async signUp(email, password, username) {
        // 1. Captura as credenciais de hardware antes de criar a conta
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();
        const mac = await Security.getHardwareID();

        // 2. Verifica se este IP/MAC já atingiu o limite de 5 contas (Front-end check)
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .or(`last_ip.eq.${ip},last_mac.eq.${mac}`);

        if (count >= 5) {
            throw new Error("Limite de segurança: Você já possui 5 contas vinculadas a este dispositivo.");
        }

        // 3. Cria o usuário no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: username }
            }
        });

        if (error) throw error;

        // 4. Cria o perfil na tabela 'profiles' com os dados de rastreio
        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert([
                {
                    id: data.user.id,
                    username: username,
                    last_ip: ip,
                    last_mac: mac,
                    role: 'user', // Padrão
                    coins: 0,
                    vip_level: 0
                }
            ]);
            if (profileError) throw profileError;
        }

        return data;
    },

    /**
     * Realiza o login e atualiza os rastros (IP/MAC)
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Atualiza os dados de rede a cada login para monitorar mudanças de IP
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipRes.json();
        const mac = await Security.getHardwareID();

        await supabase.from('profiles').update({
            last_ip: ip,
            last_mac: mac,
            last_online: new Date().toISOString()
        }).eq('id', data.user.id);

        return data;
    },

    /**
     * Encerra a sessão
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Erro ao sair:", error.message);
        window.location.href = 'login.html';
    },

    /**
     * Verifica se o usuário está logado e retorna o perfil completo
     */
    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile;
    }
};
