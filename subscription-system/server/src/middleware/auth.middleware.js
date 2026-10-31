const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_x_makeaton';

/**
 * Validates password rules:
 * - Greater than 8 characters (>8)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length <= 8) {
    return { valid: false, message: 'Password must be more than 8 characters long' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  const hasLowerCase = /[a-z]/.test(password);
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Express middleware to authenticate JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Generate a JWT token for a user object
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

module.exports = {
  validatePassword,
  authenticateToken,
  generateToken,
  JWT_SECRET
};
