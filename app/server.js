require('dotenv').config({ path: '../.env' });

const express = require("express");
const path = require("path");
const https = require('https');
const fs = require('fs');
const app = express();

const authMiddleware = require('./middleware/auth');
const cookieParser = require('cookie-parser');

const adminMiddleware = require('./middleware/admin');

const privateKey = fs.readFileSync('localhost-key.pem', 'utf8');
const certificate = fs.readFileSync('localhost.pem', 'utf8');

const passphrase = '1234';
const credentials = { key: privateKey, passphrase, cert: certificate };

const httpsServer = https.createServer(credentials, app);


function ensureSecure(req, res, next) {
    if (req.secure) {
        return next();
    }
    
    res.redirect('https://' + req.hostname + req.originalUrl);
}


app.use(ensureSecure);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");

app.use("/api/auth",    authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login",                   (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register",                (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile", authMiddleware, (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin", authMiddleware, adminMiddleware, (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));


app.get("/test",      (_req, res) => res.send("db admin: root, pwd : root"));

httpsServer.listen(process.env.PORT, () => {
    console.log(`Serveur démarré sur le port ${process.env.PORT}`);
});

