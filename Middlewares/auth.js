const jwt = require('jsonwebtoken');
const prisma = require('../Config/prisma')


// Middleware to check if the user is authenticated *(logged in)*
exports.AuthCheck = async (req, res, next) => {
    try {
        const headerToken = req.headers.authorization;
        if (!headerToken) {
            return res.status(401).json({ error: 'No token provided' });
        }
        // Check if the token starts with 'Bearer Token'
        if (!headerToken.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        // Split the header value by space and get the second part (the token)
        const token = headerToken.split(' ')[1]; 

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded; // Attach the decoded user information to the request object
        const user = await prisma.users.findUnique({
            where: {
                email: req.user.email,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        console.error('Error in AuthCheck middleware:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }

        res.status(500).json({ error: 'Server error' });
        
    }
};


// Middleware to check if the user is an admin
exports.CheckAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const {email} = req.user;
        const user = await prisma.users.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (user.roles !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
