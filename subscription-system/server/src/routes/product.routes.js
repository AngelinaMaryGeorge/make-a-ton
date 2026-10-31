const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

// Public or Staff/Customer: list products & plans
router.get('/', ProductController.getProducts);
router.get('/plans/all', ProductController.getPlans);
router.get('/:id', ProductController.getProductById);

// Admin-only operations
router.post('/', authenticateToken, requireAdmin, ProductController.createProduct);
router.post('/:id/variants', authenticateToken, requireAdmin, ProductController.addVariant);
router.post('/:id/plans', authenticateToken, requireAdmin, ProductController.addPlan);

module.exports = router;
