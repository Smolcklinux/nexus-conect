async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        loadProfile(data.user.id);
    }
}

function triggerFileUpload() { document.getElementById('file-input').click(); }

async function uploadPhoto(input) {
    const file = input.files[0];
    const user = (await supabase.auth.getUser()).data.user;
    
    const filePath = `avatars/${user.id}-${Date.now()}`;
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file);

    if (data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
        document.getElementById('user-img').src = urlData.publicUrl;
    }
}

async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        if (data.avatar_url) document.getElementById('user-img').src = data.avatar_url;
        if (data.is_vip) {
            document.getElementById('local-user').classList.add('is-vip');
            document.getElementById('vip-tag').classList.remove('hidden');
        }
    }
}
