const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    
    handler: (req, res ) => {
        const msg = encodeURIComponent('Trop de tentavives, réessayez plus tard');
        return res.redirect('/login?flashType=error&flashMessage=' + msg);
    },
});

module.exports = { loginLimiter };