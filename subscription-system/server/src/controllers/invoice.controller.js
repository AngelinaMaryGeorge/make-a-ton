const InvoiceModel = require('../models/invoice.model');
const BillingScheduler = require('../services/billingScheduler');
const TaxCalculator = require('../services/taxCalculator');

const InvoiceController = {
  /**
   * Get all invoices (Staff/Admin) with status and overdue filters
   */
  async getInvoices(req, res) {
    try {
      const { status, customer_id, overdue } = req.query;
      const invoices = await InvoiceModel.getAll({
        status,
        customer_id,
        overdue: overdue === 'true'
      });
      return res.status(200).json({ success: true, invoices });
    } catch (err) {
      console.error('Error fetching invoices:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Customer Portal: Get invoices for current user
   */
  async getMyInvoices(req, res) {
    try {
      const customerId = req.user.id;
      const invoices = await InvoiceModel.getAll({ customer_id: customerId });
      return res.status(200).json({ success: true, invoices });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single invoice details
   */
  async getInvoiceById(req, res) {
    try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      // Check role authorization
      if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      return res.status(200).json({ success: true, invoice });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Create an invoice manually (Staff)
   */
  async createInvoice(req, res) {
    try {
      const { customer_id, subscription_id, due_date, items = [], billing_period_start, billing_period_end } = req.body;
      if (!customer_id || !due_date || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Customer, due date, and at least one item are required' });
      }

      const taxCalc = await TaxCalculator.computeLineItemsTax(items);

      const invoice = await InvoiceModel.create({
        customer_id,
        subscription_id,
        status: 'Draft',
        billing_period_start,
        billing_period_end,
        due_date,
        subtotal: taxCalc.subtotal,
        tax_amount: taxCalc.tax_amount,
        discount_amount: 0,
        total_amount: taxCalc.total_amount,
        items: taxCalc.items
      });

      return res.status(201).json({ success: true, message: 'Invoice created in Draft state', invoice });
    } catch (err) {
      console.error('Error creating invoice:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update invoice status (Draft -> Confirmed -> Paid, Cancelled)
   */
  async updateStatus(req, res) {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const updated = await InvoiceModel.updateStatus(invoiceId, status);
      return res.status(200).json({ success: true, message: `Invoice status changed to ${status}`, invoice: updated });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Trigger automated billing cycle manually (Billing Day Action)
   */
  async runBillingCycle(req, res) {
    try {
      const { target_date } = req.body;
      const result = await BillingScheduler.runBillingCycle(target_date);
      return res.status(200).json({
        success: true,
        message: `Billing cycle executed. Generated ${result.generatedCount} invoices.`,
        details: result
      });
    } catch (err) {
      console.error('Error executing billing cycle:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Simulated Send Invoice via Email
   */
  async sendInvoice(req, res) {
    try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

      return res.status(200).json({
        success: true,
        message: `Invoice ${invoice.invoice_number} successfully emailed to ${invoice.customer_email}`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = InvoiceController;
