const express = require('express');
const router = express.Router();
const QuoteController = require('../controllers/quote.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireStaff } = require('../middleware/rbac.middleware');

// Quotation templates
router.get('/templates', authenticateToken, requireStaff, QuoteController.getTemplates);
router.post('/templates', authenticateToken, requireStaff, QuoteController.createTemplate);

// Quotes
router.get('/', authenticateToken, requireStaff, QuoteController.getQuotes);
router.post('/', authenticateToken, requireStaff, QuoteController.createQuote);
router.post('/:id/convert', authenticateToken, requireStaff, QuoteController.convertQuote);

module.exports = router;
