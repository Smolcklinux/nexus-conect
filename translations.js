const translations = {
    pt: { join: "Entrar na Voz", leave: "Sair da Sala" },
    en: { join: "Join Voice", leave: "Leave Room" },
    es: { join: "Entrar a Voz", leave: "Salir de Sala" }
};
let currentLang = 'pt';
function updateLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-action').innerText = translations[lang].join;
}
