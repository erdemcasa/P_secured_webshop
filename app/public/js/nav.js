// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier

// Fonction pour verifier si l'user est ocnnncecté
async function isAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            return data.authenticated ? data.user : null;
        }
    } catch (e) {
        console.error("Erreur de vérification de l'authentification:", e);
    }
    return null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;

    const user = await isAuth();

    let links = '';
    if (user) {
        links = `
            <a href="/profile">Profil</a>
            <a href="/admin">Admin</a>
            <a href="/api/auth/logout">Déconnexion</a>
            <span style="margin-left: 1rem; font-weight: bold;">Bonjour, ${user.email}</span>
        `;
    } else {
        links = `
            <a href="/login">Connexion</a>
            <a href="/register">Inscription</a>
        `;
    }

    nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                    <a href="/">Accueil</a>
                    ${links}
                </nav>
            </div>
        </header>
    `;
});
