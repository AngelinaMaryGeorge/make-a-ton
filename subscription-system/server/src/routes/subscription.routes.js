const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireStaff } = require('../middleware/rbac.middleware');

// Customer portal route
router.get('/me', authenticateToken, SubscriptionController.getMySubscriptions);

// Staff/Admin routes
router.get('/', authenticateToken, requireStaff, SubscriptionController.getSubscriptions);
router.post('/', authenticateToken, requireStaff, SubscriptionController.createSubscription);
router.get('/:id', authenticateToken, SubscriptionController.getSubscriptionById);

// Status updates & lifecycle (Admin/Staff, or Customer pausing their own)
router.patch('/:id/status', authenticateToken, SubscriptionController.updateStatus);
router.post('/:id/renew', authenticateToken, requireStaff, SubscriptionController.renewSubscription);

module.exports = router;
