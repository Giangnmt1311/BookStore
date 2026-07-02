const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET_KEY

const verifyAdminToken =  (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied. No token provided'});
    }
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided'});
    }
    
    if (!JWT_SECRET) {
        console.error('JWT_SECRET_KEY is not set in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please login again.' });
            }
            if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: 'Invalid token. Please login again.' });
            }
            return res.status(403).json({ message: 'Invalid credentials' });
        }
        req.user = user;
        next();
    })

}

module.exports = verifyAdminToken;