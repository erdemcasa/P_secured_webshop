# Tutoriel : Ajouter l'Authentification, la Protection des Routes et la Navbar Dynamique

Ce tutoriel vous guidera étape par étape pour ajouter un système de connexion basé sur JWT (JSON Web Tokens) stocké dans des cookies, protéger les routes privées (`/profile`, `/admin`), et adapter dynamiquement la barre de navigation selon l'état de connexion de l'utilisateur.

## Étape 1 : Installer les dépendances requises

Ouvrez votre terminal dans le dossier `app` et installez les paquets suivants :

```bash
npm install jsonwebtoken cookie-parser
```

## Étape 2 : Configurer `server.js`

Il faut indiquer à Express d'utiliser `cookie-parser` et protéger les routes qui nécessitent une authentification.

Ouvrez `server.js` et modifiez-le pour ajouter ces éléments :

```javascript
// Ajoutez cookie-parser en haut du fichier
const cookieParser = require("cookie-parser");

// ...
const app = express();

// Activez cookie-parser avant les middlewares de body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... [Fichiers statiques et autres configurations] ...

// Importez le middleware d'authentification
const authMiddleware = require("./middleware/auth");

// Protégez les routes API
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");

app.use("/api/auth",    authRoute);
app.use("/api/profile", authMiddleware, profileRoute); // <-- Route protégée
app.use("/api/admin",   authMiddleware, adminRoute);   // <-- Route protégée

// Protégez les routes Pages (HTML)
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile",  authMiddleware, (req, res) => res.sendFile(path.join(__dirname, "views", "profile.html"))); // <-- Route protégée
app.get("/admin",    authMiddleware, (req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));   // <-- Route protégée
```

## Étape 3 : Rédiger le middleware d'authentification

Le middleware interceptera les requêtes pour vérifier si l'utilisateur possède un token valide.

Modifiez le fichier `middleware/auth.js` :

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_default_key';

module.exports = (req, res, next) => {
    // On récupère le token depuis les cookies
    const token = req.cookies?.auth_token;
    
    // Fonction utilitaire pour rejeter l'accès
    const handleUnauthorized = () => {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ error: 'Non autorisé' });
        }
        return res.redirect('/login');
    };

    if (!token) {
        return handleUnauthorized();
    }

    // On vérifie la validité du token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return handleUnauthorized();
        }
        // Si tout est bon, on attache les infos de l'utilisateur à la requête
        req.user = decoded;
        next();
    });
};
```

## Étape 4 : Mettre à jour `AuthController.js`

Dans `controllers/AuthController.js`, importez `jsonwebtoken` et mettez à jour la méthode de login. Ajoutez également des fonctions pour vérifier la session (`me`) et se déconnecter (`logout`).

```javascript
// En haut du fichier, ajoutez l'import de JWT et la clé secrète
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_default_key';

// ... (Gardez le reste de vos imports et constantes) ...

module.exports = {
    login: async (req, res) => {
        // ... (Gardez la vérification initiale de l'email et mot de passe) ...
        
        db.query(query, [email], async (err, results) => {
            // ... (Gardez les vérifications d'erreur et de isMatch) ...

            if (!isMatch) {
                return redirectWithFlash(res, '/login', 'error', 'Email ou mot de passe incorrect');
            }

            delete user.password;

            // NOUVEAU CODE : Génération du token et sauvegarde dans un cookie
            const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('auth_token', token, { httpOnly: true, secure: false, maxAge: 3600000 });

            return redirectWithFlash(res, '/profile', 'success', 'Connexion réussie');
        });
    },

    register: async (req, res) => {
        // ... (Ne changez rien à register) ...
    },

    // NOUVELLE FONCTION : Vérifier qui est connecté (utilisé par la navbar)
    me: (req, res) => {
        const token = req.cookies.auth_token;
        if (!token) return res.status(401).json({ authenticated: false });

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ authenticated: false });
            return res.json({ authenticated: true, user: decoded });
        });
    },

    // NOUVELLE FONCTION : Déconnexion
    logout: (req, res) => {
        res.clearCookie('auth_token');
        res.redirect('/');
    }
};
```

## Étape 5 : Déclarer les nouvelles routes d'authentification

Ouvrez `routes/Auth.js` et ajoutez les routes `me` et `logout` :

```javascript
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/AuthController');

router.post('/login',    controller.login);
router.post('/register', controller.register);

// Nouvelles routes
router.get('/me',        controller.me);
router.get('/logout',    controller.logout);

module.exports = router;
```

## Étape 6 : Rendre la Navbar dynamique

Ouvrez `public/js/nav.js` pour y faire un appel API (Fetch) qui vérifie si l'utilisateur est connecté et affiche les liens en conséquence :

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.getElementById('topbar');
    if (!nav) return;

    // État par défaut (Non connecté)
    let authHtml = `
        <a href="/login">Connexion</a>
        <a href="/register">Inscription</a>
    `;
    let privateLinks = '';

    try {
        // Interroge l'API pour savoir si l'utilisateur a un cookie valide
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                // État Connecté
                authHtml = `
                    <span style="color: white; margin-right: 1rem;">Bonjour, ${data.user.username}</span>
                    <a href="/api/auth/logout">Déconnexion</a>
                `;
                privateLinks = `
                    <a href="/profile">Profil</a>
                    <a href="/admin">Admin</a>
                `;
            }
        }
    } catch (e) {
        console.error("Erreur de récupération du profil:", e);
    }

    nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                    <a href="/">Accueil</a>
                    ${privateLinks}
                    ${authHtml}
                </nav>
            </div>
        </header>
    `;
});
```

Vous avez terminé ! Relancez votre serveur web, et le système d'authentification avec la barre de navigation dynamique sera fonctionnel !
