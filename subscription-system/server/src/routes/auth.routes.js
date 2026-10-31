const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin, requireStaff } = require('../middleware/rbac.middleware');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Authenticated routes
router.get('/me', authenticateToken, AuthController.getMe);
router.get('/staff', authenticateToken, requireAdmin, AuthController.getStaff);
router.post('/staff', authenticateToken, requireAdmin, AuthController.createStaff);

// Business & Admin: Client Management routes
router.get('/clients', authenticateToken, requireStaff, AuthController.getClients);
router.post('/clients', authenticateToken, requireStaff, AuthController.createClient);

module.exports = router;
