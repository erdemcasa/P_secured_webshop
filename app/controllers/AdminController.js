const db = require('../config/db');

module.exports = {

    // ----------------------------------------------------------
    // GET /api/admin/users
    // ----------------------------------------------------------
    getUsers: (_req, res) => {
        db.query('SELECT id, username, email, role, address FROM users', (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(results);
        });
    },

    // ----------------------------------------------------------
    // POST /api/admin/users
    // ----------------------------------------------------------
    createUser: (req, res) => {
        const { username, email, password, role, address } = req.body;
        db.query('INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, ?, ?)', [username, email, password, role, address], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(results);
        });
    }

    
};
