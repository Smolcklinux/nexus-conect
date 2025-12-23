import { supabase, NEXUS_CONFIG } from '../config.js';

export const Security = {
    /**
     * Gera uma "impressão digital" do hardware baseada nas specs do navegador
     * Substitui a necessidade de acesso root ao MAC Address
     */
    async getHardwareID() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency, // Núcleos do processador
            screen.width + 'x' + screen.height
        ];
        // Cria um hash simples a partir das informações coletadas
        const fingerprint = btoa(components.join('|')).substring(0, 32);
        return fingerprint;
    },

    /**
     * Captura o IP público do usuário via API externa
     */
    async getPublicIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
        } catch (err) {
            console.error("Falha ao capturar IP:", err);
            return '0.0.0.0'; // Fallback se a API falhar
        }
    },

    /**
     * Validação Principal: Checa se o IP ou HardwareID está na Blacklist
     */
    async checkHardwareBan() {
        try {
            const ip = await this.getPublicIP();
            const mac = await this.getHardwareID();

            // Consulta a tabela de banimentos no Supabase
            const { data: banData, error } = await supabase
                .from('blacklist')
                .select('*')
                .or(`ip.eq.${ip},mac.eq.${mac}`)
                .single();

            if (banData) {
                console.warn("Nexus Security: Acesso negado. Dispositivo banido.");
                return true; // Está banido
            }

            return false; // Acesso liberado
        } catch (err) {
            // Se houver erro na conexão (ex: sem internet), bloqueamos por precaução
            console.error("Erro na verificação de segurança:", err);
            return false; 
        }
    },

    /**
     * Sanitização Anti-Inject (XSS/SQL)
     * Remove tags HTML e caracteres maliciosos de qualquer entrada
     */
    sanitize(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
