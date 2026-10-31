const db = require('../config/db');

const InvoiceModel = {
  async getAll(filters = {}) {
    let sql = `
      SELECT i.*, 
             c.name as customer_name, c.email as customer_email, c.company as customer_company,
             s.subscription_number
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`i.status = $${params.length}`);
    }
    if (filters.customer_id) {
      params.push(filters.customer_id);
      conditions.push(`i.customer_id = $${params.length}`);
    }
    if (filters.subscription_id) {
      params.push(filters.subscription_id);
      conditions.push(`i.subscription_id = $${params.length}`);
    }
    if (filters.overdue) {
      conditions.push(`i.status != 'Paid' AND i.due_date < CURRENT_DATE`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY i.id DESC';

    const res = await db.query(sql, params);
    const invoices = res.rows.map(this.formatInvoice);

    for (const inv of invoices) {
      const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [inv.id]);
      inv.items = itemsRes.rows.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        discount_applied: parseFloat(item.discount_applied || 0),
        total_amount: parseFloat(item.total_amount)
      }));
    }
    return invoices;
  },

  async findById(id) {
    const res = await db.query(`
      SELECT i.*, 
             c.name as customer_name, c.email as customer_email, c.company as customer_company, c.phone as customer_phone,
             s.subscription_number, s.payment_terms
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const inv = this.formatInvoice(res.rows[0]);

    const itemsRes = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
    inv.items = itemsRes.rows.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      tax_rate: parseFloat(item.tax_rate),
      discount_applied: parseFloat(item.discount_applied || 0),
      total_amount: parseFloat(item.total_amount)
    }));

    const paymentsRes = await db.query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC', [id]);
    inv.payments = paymentsRes.rows.map(p => ({
      ...p,
      amount: parseFloat(p.amount)
    }));

    return inv;
  },

  formatInvoice(inv) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = inv.status !== 'Paid' && inv.due_date < today;
    return {
      ...inv,
      subtotal: parseFloat(inv.subtotal),
      tax_amount: parseFloat(inv.tax_amount),
      discount_amount: parseFloat(inv.discount_amount || 0),
      total_amount: parseFloat(inv.total_amount),
      amount_paid: parseFloat(inv.amount_paid || 0),
      amount_due: parseFloat(inv.amount_due),
      is_overdue: isOverdue
    };
  },

  async create({ subscription_id = null, customer_id, status = 'Draft', billing_period_start = null, billing_period_end = null, due_date, subtotal = 0, tax_amount = 0, discount_amount = 0, total_amount, items = [] }) {
    const countRes = await db.query('SELECT COUNT(*) as count FROM invoices');
    const seq = parseInt(countRes.rows[0]?.count || 0) + 1;
    const invoice_number = `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    const amount_due = total_amount;

    const res = await db.query(`
      INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, billing_period_start, billing_period_end, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0.00, $12)
    `, [invoice_number, subscription_id, customer_id, status, billing_period_start, billing_period_end, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_due]);

    const invoiceId = res.lastID;

    for (const item of items) {
      await db.query(`
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, tax_rate, discount_applied, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        invoiceId,
        item.product_id || null,
        item.description || 'Subscription Line Item',
        item.quantity || 1,
        item.unit_price,
        item.tax_rate || 18.00,
        item.discount_applied || 0.00,
        item.total_amount
      ]);
    }

    return this.findById(invoiceId);
  },

  async updateStatus(id, newStatus) {
    const valid = ['Draft', 'Confirmed', 'Paid', 'Cancelled'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Invalid invoice status: ${newStatus}`);
    }
    await db.query('UPDATE invoices SET status = $1 WHERE id = $2', [newStatus, id]);
    return this.findById(id);
  }
};

module.exports = InvoiceModel;
