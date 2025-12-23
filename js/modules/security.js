export const Security = {
    // Sanitização contra XSS (Inject)
    sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Gera Fingerprint Único (Substituto do MAC para Web)
    async getFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency
        ];
        return btoa(components.join('|'));
    },

    // Bloqueia F12 e Botão Direito para evitar Inspect por usuários comuns
    initAntiInspect(role) {
        if (role === 'owner' || role === 'adm') return;
        
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J"))) {
                e.preventDefault();
                alert("Acesso restrito à equipe Nexus.");
            }
        });
    }
};
