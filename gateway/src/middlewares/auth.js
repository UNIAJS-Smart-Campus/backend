function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    next();
}

module.exports = authMiddleware;
