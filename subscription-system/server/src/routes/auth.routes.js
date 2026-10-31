const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Authenticated routes
router.get('/me', authenticateToken, AuthController.getMe);
router.get('/staff', authenticateToken, requireAdmin, AuthController.getStaff);

module.exports = router;
