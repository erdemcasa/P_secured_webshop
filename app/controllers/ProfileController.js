const path = require('path');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Get l'id de l'user avec le jwt
const getUserIdFromToken = (req) => {
    const token = req.cookies?.auth_token;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        return null;
    }
};

module.exports = {

    // ----------------------------------------------------------
    // GET /api/profile
    // ----------------------------------------------------------
    get: (_req, res) => {
        const userId = getUserIdFromToken(_req);

        if (!userId) {
            return res.status(401).json({ error: 'Accès non autorisé' });
        }

        db.query('SELECT id, username, email, role, address, photo_path FROM users WHERE id = ?', [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }
            res.json(results[0]);
        });
    },

    // ----------------------------------------------------------
    // POST /api/profile
    // ----------------------------------------------------------
    update: (req, res) => {
        const userId = getUserIdFromToken(req);
        const { address } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Accès non autorisé' });
        }

        db.query('UPDATE users SET address = ? WHERE id = ?', [address, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json({ message: 'Profil mis à jour' });
        });
    },

    // ----------------------------------------------------------
    // POST /api/profile/photo
    // ----------------------------------------------------------
    uploadPhoto: (req, res) => {
        const userId = getUserIdFromToken(req);

        if (!userId) {
            return res.status(401).json({ error: 'Accès non autorisé' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier reçu' });
        }

        const photoPath = '/uploads/' + req.file.filename;

        db.query('UPDATE users SET photo_path = ? WHERE id = ?', [photoPath, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json({ message: 'Photo mise à jour', photo_path: photoPath });
        });
    }
};
