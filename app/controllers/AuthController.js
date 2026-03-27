const db = require('../config/db');
const router = require('../routes/Auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const PEPPER = process.env.PASSWORD_PEPPER;

const SALT_ROUNDS = 12;
module.exports = {

    // ----------------------------------------------------------
    // POST /api/auth/login
    // ----------------------------------------------------------
    login: (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const query = `SELECT * FROM users WHERE email = '${email}'`;

        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message, query: query });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            res.json({ message: 'Connexion réussie', user: results[0] });
        });
    },

    // ----------------------------------------------------------
    // POST /api/auth/register
    // ----------------------------------------------------------
    register: async (req, res) => {
        try {
            const { username, email, password, address } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Tous les champs sont requis' });
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
                    return res.status(500).json({ error: "Erreur lors de la vérification de l'utilisateur" });
                }

                if (checkResults.length > 0) {
                    return res.status(409).json({ error: "Cet email ou nom d'utilisateur existe déjà" });
                }

                const query = `INSERT INTO users (username, email, password, address) VALUES (?, ?, ?, ?)`;

                db.query(query, [username, email, hPwd, address], (err, results) => {
                    if (err) {
                        return res.status(500).json({
                            error: "Une erreur est survenue lors de l'inscription",
                            details: err.message
                        });
                    }
                    
                    res.status(201).json({
                        message: 'Inscription réussie',
                        userId: results.insertId
                    });
                });
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return res.status(500).json({ error: "Une erreur interne est survenue" });
        }
    }
};
