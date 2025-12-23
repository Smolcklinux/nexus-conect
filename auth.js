async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await window.supabaseClient.auth.signUp({ email, password });

    if (error) alert("Erro no cadastro: " + error.message);
    else alert("Cadastro realizado! Se o e-mail de confirmação estiver ativo no seu Supabase, verifique sua caixa de entrada.");
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Erro no login: " + error.message);
    } else {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        loadProfile(data.user.id);
    }
}

function triggerFileUpload() { document.getElementById('file-input').click(); }

async function uploadPhoto(input) {
    const file = input.files[0];
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    const filePath = `avatars/${user.id}-${Date.now()}`;
    const { data, error } = await window.supabaseClient.storage.from('avatars').upload(filePath, file);

    if (data) {
        const { data: urlData } = window.supabaseClient.storage.from('avatars').getPublicUrl(filePath);
        await window.supabaseClient.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
        document.getElementById('user-img').src = urlData.publicUrl;
    }
}

async function loadProfile(userId) {
    const { data } = await window.supabaseClient.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        if (data.avatar_url) document.getElementById('user-img').src = data.avatar_url;
        if (data.is_vip) {
            document.getElementById('local-user').classList.add('is-vip');
            document.getElementById('vip-tag').classList.remove('hidden');
        }
    }
}
