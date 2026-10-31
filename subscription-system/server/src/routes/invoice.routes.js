const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoice.controller');
const PaymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireStaff } = require('../middleware/rbac.middleware');

// Customer portal
router.get('/me', authenticateToken, InvoiceController.getMyInvoices);

// Invoices list & single
router.get('/', authenticateToken, requireStaff, InvoiceController.getInvoices);
router.post('/', authenticateToken, requireStaff, InvoiceController.createInvoice);
router.get('/:id', authenticateToken, InvoiceController.getInvoiceById);

// Pipeline updates & actions
router.patch('/:id/status', authenticateToken, requireStaff, InvoiceController.updateStatus);
router.post('/:id/send', authenticateToken, requireStaff, InvoiceController.sendInvoice);

// Payment logging against invoice (matches /invoices/:id/payments)
router.post('/:id/payments', authenticateToken, requireStaff, PaymentController.recordPayment);

// Billing Cycle Trigger
router.post('/run-billing', authenticateToken, requireStaff, InvoiceController.runBillingCycle);

module.exports = router;
