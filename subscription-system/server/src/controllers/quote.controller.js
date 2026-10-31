const db = require('../config/db');
const SubscriptionModel = require('../models/subscription.model');
const ProductModel = require('../models/product.model');
const TaxCalculator = require('../services/taxCalculator');

const QuoteController = {
  /**
   * Get all quotation templates
   */
  async getTemplates(req, res) {
    try {
      const result = await db.query(`
        SELECT qt.*, p.name as plan_name, p.billing_frequency, p.price as plan_price
        FROM quotation_templates qt
        LEFT JOIN plans p ON qt.plan_id = p.id
        ORDER BY qt.id ASC
      `);

      const templates = result.rows.map(t => {
        let lines = [];
        try {
          lines = JSON.parse(t.default_lines || '[]');
        } catch (e) {
          lines = [];
        }
        return {
          ...t,
          default_lines: lines
        };
      });

      return res.status(200).json({ success: true, templates });
    } catch (err) {
      console.error('Error fetching quotation templates:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin/Staff: Create new quotation template
   */
  async createTemplate(req, res) {
    try {
      const { name, plan_id, valid_days, description, default_lines } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Template name is required' });
      }

      const resDb = await db.query(`
        INSERT INTO quotation_templates (name, plan_id, valid_days, description, default_lines)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        name,
        plan_id || null,
        valid_days || 30,
        description || '',
        typeof default_lines === 'object' ? JSON.stringify(default_lines) : default_lines || '[]'
      ]);

      return res.status(201).json({ success: true, message: 'Template created', templateId: resDb.lastID });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get all quotes
   */
  async getQuotes(req, res) {
    try {
      const result = await db.query(`
        SELECT q.*, 
               c.name as customer_name, c.email as customer_email, c.company as customer_company,
               p.name as plan_name, p.billing_frequency,
               qt.name as template_name
        FROM quotes q
        JOIN customers c ON q.customer_id = c.id
        LEFT JOIN plans p ON q.plan_id = p.id
        LEFT JOIN quotation_templates qt ON q.template_id = qt.id
        ORDER BY q.id DESC
      `);

      const quotes = result.rows;
      for (const q of quotes) {
        const itemsRes = await db.query(`
          SELECT qi.*, pr.name as product_name
          FROM quote_items qi
          JOIN products pr ON qi.product_id = pr.id
          WHERE qi.quote_id = $1
        `, [q.id]);
        q.items = itemsRes.rows.map(item => ({
          ...item,
          unit_price: parseFloat(item.unit_price),
          tax_rate: parseFloat(item.tax_rate),
          amount: parseFloat(item.amount)
        }));
      }

      return res.status(200).json({ success: true, quotes });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Create Quote (Staff)
   * Supports starting from template or custom items
   */
  async createQuote(req, res) {
    try {
      const { customer_id, template_id, plan_id, valid_days = 15, payment_terms = 'Net 30', notes = '', items = [] } = req.body;

      if (!customer_id) {
        return res.status(400).json({ success: false, message: 'Customer ID is required' });
      }

      let quotePlanId = plan_id;
      let quoteItems = [...items];

      // If template_id is specified, load defaults
      if (template_id) {
        const tRes = await db.query('SELECT * FROM quotation_templates WHERE id = $1', [template_id]);
        if (tRes.rows.length > 0) {
          const t = tRes.rows[0];
          if (!quotePlanId) quotePlanId = t.plan_id;
          if (quoteItems.length === 0) {
            try {
              quoteItems = JSON.parse(t.default_lines || '[]');
            } catch (e) {
              quoteItems = [];
            }
          }
        }
      }

      // If still no items, default to the plan's product
      if (quoteItems.length === 0 && quotePlanId) {
        const pRes = await db.query('SELECT product_id, price FROM plans WHERE id = $1', [quotePlanId]);
        if (pRes.rows.length > 0) {
          quoteItems.push({
            product_id: pRes.rows[0].product_id,
            quantity: 1,
            unit_price: parseFloat(pRes.rows[0].price),
            tax_rate: 18.00
          });
        }
      }

      // Compute pricing and taxes
      let subtotal = 0;
      let taxAmount = 0;
      const computedItems = [];

      for (const it of quoteItems) {
        let unitPrice = it.unit_price;
        let variantName = it.variant_name || null;

        if (unitPrice === undefined || unitPrice === null) {
          unitPrice = await ProductModel.calculatePrice(it.product_id, it.variant_id);
        }

        const qty = parseInt(it.quantity) || 1;
        const lineSubtotal = qty * unitPrice;
        const rate = it.tax_rate !== undefined ? parseFloat(it.tax_rate) : 18.00;
        const lineTax = TaxCalculator.calculateTax(lineSubtotal, rate);

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        computedItems.push({
          product_id: it.product_id,
          variant_id: it.variant_id || null,
          variant_name: variantName,
          quantity: qty,
          unit_price: unitPrice,
          tax_rate: rate,
          amount: Math.round((lineSubtotal + lineTax) * 100) / 100
        });
      }

      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

      // Validity date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(valid_days));
      const validUntilStr = validUntil.toISOString().split('T')[0];

      // Sequence
      const countRes = await db.query('SELECT COUNT(*) as count FROM quotes');
      const seq = parseInt(countRes.rows[0]?.count || 0) + 1;
      const quoteNumber = `QT-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

      const resDb = await db.query(`
        INSERT INTO quotes (quote_number, customer_id, template_id, plan_id, status, valid_until, payment_terms, notes, subtotal, tax_amount, total_amount)
        VALUES ($1, $2, $3, $4, 'Sent', $5, $6, $7, $8, $9, $10)
      `, [
        quoteNumber,
        customer_id,
        template_id || null,
        quotePlanId || 1,
        validUntilStr,
        payment_terms,
        notes,
        subtotal,
        taxAmount,
        totalAmount
      ]);

      const quoteId = resDb.lastID;

      // Insert line items
      for (const ci of computedItems) {
        await db.query(`
          INSERT INTO quote_items (quote_id, product_id, variant_id, variant_name, quantity, unit_price, tax_rate, amount)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [quoteId, ci.product_id, ci.variant_id, ci.variant_name, ci.quantity, ci.unit_price, ci.tax_rate, ci.amount]);
      }

      return res.status(201).json({
        success: true,
        message: 'Quotation created successfully',
        quote: {
          id: quoteId,
          quote_number: quoteNumber,
          customer_id,
          plan_id: quotePlanId,
          valid_until: validUntilStr,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          items: computedItems
        }
      });
    } catch (err) {
      console.error('Error creating quote:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Convert Quote into an Active Subscription
   */
  async convertQuote(req, res) {
    try {
      const quoteId = parseInt(req.params.id);
      const qRes = await db.query('SELECT * FROM quotes WHERE id = $1', [quoteId]);
      if (qRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const quote = qRes.rows[0];
      if (quote.status === 'Converted') {
        return res.status(400).json({ success: false, message: 'This quotation has already been converted to a subscription' });
      }

      const itemsRes = await db.query('SELECT * FROM quote_items WHERE quote_id = $1', [quoteId]);
      const quoteItems = itemsRes.rows;

      const startDate = new Date().toISOString().split('T')[0];
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const expiryDateStr = expiryDate.toISOString().split('T')[0];

      // Create subscription in 'Active' state (or Confirmed)
      const subscription = await SubscriptionModel.create({
        customer_id: quote.customer_id,
        plan_id: quote.plan_id || 1,
        quote_id: quote.id,
        status: 'Active',
        start_date: startDate,
        expiry_date: expiryDateStr,
        payment_terms: quote.payment_terms || 'Net 30',
        notes: `Converted from quotation ${quote.quote_number}. ${quote.notes || ''}`,
        items: quoteItems.map(qi => ({
          product_id: qi.product_id,
          variant_id: qi.variant_id,
          variant_name: qi.variant_name,
          quantity: qi.quantity,
          unit_price: parseFloat(qi.unit_price),
          tax_rate: parseFloat(qi.tax_rate)
        }))
      });

      // Update quote status to Converted
      await db.query("UPDATE quotes SET status = 'Converted' WHERE id = $1", [quoteId]);

      return res.status(200).json({
        success: true,
        message: 'Quotation successfully converted to active subscription',
        subscription
      });
    } catch (err) {
      console.error('Error converting quote:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = QuoteController;
