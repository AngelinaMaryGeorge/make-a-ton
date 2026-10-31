const express = require('express');
const router = express.Router();
const DiscountModel = require('../models/discount.model');
const DiscountEngine = require('../services/discountEngine');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireAdmin, requireStaff } = require('../middleware/rbac.middleware');

// List discount rules
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const discounts = await DiscountModel.getAll();
    return res.status(200).json({ success: true, discounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Create discount rule
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code, name, type, amount, min_purchase, min_quantity, usage_limit, start_date, end_date, applicable_product_id } = req.body;

    if (!type || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Discount type and amount are required' });
    }

    if (!['fixed', 'percentage'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be 'fixed' or 'percentage'" });
    }

    const discount = await DiscountModel.create({
      code,
      name,
      type,
      amount: parseFloat(amount),
      min_purchase: min_purchase ? parseFloat(min_purchase) : 0,
      min_quantity: min_quantity ? parseInt(min_quantity) : 0,
      usage_limit: usage_limit ? parseInt(usage_limit) : 100,
      start_date,
      end_date,
      applicable_product_id: applicable_product_id ? parseInt(applicable_product_id) : null
    });

    return res.status(201).json({ success: true, message: 'Discount rule created successfully', discount });
  } catch (err) {
    console.error('Error creating discount rule:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Evaluate discount code for cart / subscription
router.post('/evaluate', authenticateToken, async (req, res) => {
  try {
    const { code, total_amount, items = [] } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required' });
    }

    const result = await DiscountEngine.evaluateDiscount(code, {
      totalAmount: total_amount,
      items
    });

    return res.status(200).json({ success: true, evaluation: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
