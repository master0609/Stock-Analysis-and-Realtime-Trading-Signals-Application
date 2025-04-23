const jwt = require('jsonwebtoken');

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to require authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {function} next - Express next function
 */
exports.required = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware for optional authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {function} next - Express next function
 */
exports.optional = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;
    
    if (token) {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user info to request
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Just proceed without authentication
    next();
  }
};
