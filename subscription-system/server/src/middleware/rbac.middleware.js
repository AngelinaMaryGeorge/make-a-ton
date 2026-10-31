/**
 * Role-Based Access Control Middleware
 * Roles: 'admin', 'staff', 'customer'
 */

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    // Admin has access to all admin and staff routes
    if (userRole === 'admin') {
      return next();
    }

    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
    });
  };
}

module.exports = {
  requireRole,
  requireAdmin: requireRole('admin'),
  requireStaff: requireRole('admin', 'staff'),
  requireCustomer: requireRole('customer')
};
