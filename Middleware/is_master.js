module.exports = (req, res, next) => {
    if (!req.session.isMaster) {
        console.log(req.session.isLoggedIn)
        return res.redirect('/login');
    }
    next();
}