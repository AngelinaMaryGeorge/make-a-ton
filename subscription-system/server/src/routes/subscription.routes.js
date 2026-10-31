const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireStaff } = require('../middleware/rbac.middleware');

// Customer portal route
router.get('/me', authenticateToken, SubscriptionController.getMySubscriptions);

// Create subscription (Staff/Admin for customers, or Customer for self)
router.post('/', authenticateToken, SubscriptionController.createSubscription);

// Staff/Admin routes
router.get('/', authenticateToken, requireStaff, SubscriptionController.getSubscriptions);
router.get('/:id', authenticateToken, SubscriptionController.getSubscriptionById);

// Status updates & lifecycle (Admin/Staff, or Customer pausing their own)
router.patch('/:id/status', authenticateToken, SubscriptionController.updateStatus);
router.post('/:id/renew', authenticateToken, SubscriptionController.renewSubscription);

module.exports = router;
