const mysql = require('mysql2');

const connection = mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 6033,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        throw err;
    }
    console.log(`Connecté à la BDD ${connection.config.database} sur ${connection.config.host} en tant que ${connection.config.user}`);
});

module.exports = connection;
