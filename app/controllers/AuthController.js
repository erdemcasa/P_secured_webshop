const db = require('../config/db');
const router = require('../routes/Auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const PEPPER = process.env.PASSWORD_PEPPER;

const SALT_ROUNDS = 12;

function redirectWithFlash(res, targetPath, type, message) {
    const params = new URLSearchParams({
        flashType: type,
        flashMessage: message
    });

    return res.redirect(`${targetPath}?${params.toString()}`);
}

module.exports = {
    // ----------------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------------
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return redirectWithFlash(res, '/login', 'error', 'Email et mot de passe requis');
        }

        const query = `SELECT * FROM users WHERE email = ?`;

        db.query(query, [email], async (err, results) => {
            if (err) {
                return redirectWithFlash(res, '/login', 'error', 'Erreur serveur lors de la connexion');
            }

            if (results.length === 0) {
                return redirectWithFlash(res, '/login', 'error', 'Email ou mot de passe incorrect');
            }

            const user = results[0];

            const pepperedPassword = crypto
                .createHmac('sha256', PEPPER)
                .update(password)
                .digest('hex');

            const isMatch = await bcrypt.compare(pepperedPassword, user.password);

            if (!isMatch) {
                return redirectWithFlash(res, '/login', 'error', 'Email ou mot de passe incorrect');
            }


            // Construction du payload
            const payload = {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            // Création du jWT token avec une durée
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '1h'
            });


            delete user.password;

            res.cookie('auth_token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
            return redirectWithFlash(res, '/profile', 'success', `Bienvenue, ${user.username}!`);
        });
    },

    // ----------------------------------------------------------
    // POST /api/auth/register
    // ----------------------------------------------------------
    register: async (req, res) => {
        try {
            const { username, email, password, address } = req.body;

            if (!username || !email || !password) {
                return redirectWithFlash(res, '/register', 'error', 'Tous les champs sont requis');
            }

            // if (password.length < 6) {
            //     return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
            // }

            const pepperedPassword = crypto
                .createHmac('sha256', PEPPER)
                .update(password)
                .digest('hex');

            const hPwd = await bcrypt.hash(pepperedPassword, SALT_ROUNDS);

            const checkQuery = `SELECT id FROM users WHERE email = ? OR username = ?`;

            db.query(checkQuery, [email, username], async (checkErr, checkResults) => {
                if (checkErr) {
                    return redirectWithFlash(res, '/register', 'error', 'Erreur lors de la vérification de l\'utilisateur');
                }

                if (checkResults.length > 0) {
                    return redirectWithFlash(res, '/register', 'error', 'Cet email ou nom d\'utilisateur existe déjà');
                }

                const query = `INSERT INTO users (username, email, password, address) VALUES (?, ?, ?, ?)`;

                db.query(query, [username, email, hPwd, address], (err, results) => {
                    if (err) {
                        return redirectWithFlash(res, '/register', 'error', 'Une erreur est survenue lors de l\'inscription');
                    }

                    return redirectWithFlash(res, '/login', 'success', 'Inscription réussie, vous pouvez vous connecter');
                });
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return redirectWithFlash(res, '/register', 'error', 'Une erreur interne est survenue');
        }
    },

    // ----------------------------------------------------------
    // GET /api/auth/me
    // ----------------------------------------------------------
    me: (req, res) => {
        const token = req.cookies?.auth_token;
        if (!token) return res.json({ authenticated: false });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.json({ authenticated: true, user: decoded });
        } catch (error) {
            return res.json({ authenticated: false });
        }
    },

    // ----------------------------------------------------------
    // GET /api/auth/logout
    // ----------------------------------------------------------
    logout: (req, res) => {
        res.clearCookie('auth_token');
        return redirectWithFlash(res, '/', 'success', 'Déconnexion réussie');
    }
};
