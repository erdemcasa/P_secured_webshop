require('dotenv').config({ path: '../.env' });

const express = require("express");
const path = require("path");
    
const app = express();

const authMiddleware = require('./middleware/auth');
const cookieParser = require('cookie-parser');


app.use(cookieParser());

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");

app.use("/api/auth",    authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin",   adminRoute);

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
app.get("/admin", authMiddleware,   (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));

// Démarrage du serveur
app.get("/test",      (_req, res) => res.send("db admin: root, pwd : root"));
app.listen(8067, () => {
    console.log("Serveur démarré sur http://localhost:8067");
});
