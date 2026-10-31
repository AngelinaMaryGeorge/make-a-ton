const PaymentModel = require('../models/payment.model');
const InvoiceModel = require('../models/invoice.model');

const PaymentController = {
  /**
   * Get all payments (Staff/Admin)
   */
  async getPayments(req, res) {
    try {
      const payments = await PaymentModel.getAll();
      return res.status(200).json({ success: true, payments });
    } catch (err) {
      console.error('Error fetching payments:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Record payment for an invoice (Staff)
   * POST /api/invoices/:id/payments
   */
  async recordPayment(req, res) {
    try {
      const invoiceId = parseInt(req.params.id);
      const { amount, method = 'bank_transfer', notes = '' } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
      }

      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      if (invoice.status === 'Paid') {
        return res.status(400).json({ success: false, message: 'This invoice has already been fully paid' });
      }

      const payment = await PaymentModel.recordPayment({
        invoice_id: invoiceId,
        amount: parseFloat(amount),
        method,
        notes,
        recorded_by: req.user ? req.user.id : null
      });

      const updatedInvoice = await InvoiceModel.findById(invoiceId);

      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        payment,
        invoice: updatedInvoice
      });
    } catch (err) {
      console.error('Error recording payment:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};

module.exports = PaymentController;
