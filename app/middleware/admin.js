const checkAdmin = (req, res, next) => {
    
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        if (!req.originalUrl.startsWith('/api/')) {
            return res.redirect('/profile'); 
        }
        return res.status(403).json({ message: 'Vous n etes pas administrateur' });
    }
};

module.exports = checkAdmin;