const translations = {
    pt: { join: "Entrar na Voz", leave: "Sair da Sala", logo: "Nexus Conect" },
    en: { join: "Join Voice", leave: "Leave Room", logo: "Nexus Connect" },
    es: { join: "Entrar a Voz", leave: "Salir de Sala", logo: "Nexus Conect" }
};

function updateLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-action').innerText = translations[lang].join;
    document.getElementById('txt-logo').innerText = translations[lang].logo;
}
