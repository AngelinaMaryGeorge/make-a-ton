const db = require('../config/db');
const CustomerModel = require('./customer.model');
const crypto = require('crypto');

const InvoiceModel = {
  formatInvoice(inv, customer = null) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = inv.status !== 'Paid' && inv.due_date < today;
    const invNumber = inv.invoice_number || `INV-${new Date().getFullYear()}-${String(inv.id).padStart(4, '0')}`;
    const total = parseFloat(inv.total_amount || 0);
    const isPaid = inv.status === 'Paid';

    return {
      ...inv,
      invoice_number: invNumber,
      customer_name: customer?.name || customer?.email?.split('@')[0] || `Customer #${inv.customer_id}`,
      customer_email: customer?.email || '',
      subtotal: parseFloat(inv.subtotal || total * 0.82),
      tax_amount: parseFloat(inv.tax_amount || total * 0.18),
      discount_amount: 0,
      total_amount: total,
      amount_paid: isPaid ? total : 0,
      amount_due: isPaid ? 0 : total,
      is_overdue: isOverdue,
      items: [
        {
          description: 'Subscription Recurring Fee',
          quantity: 1,
          unit_price: parseFloat(inv.subtotal || total),
          tax_rate: 18.00,
          total_amount: total
        }
      ]
    };
  },

  async getAll(filters = {}) {
    if (db.isSupabase()) {
      let query = db.getSupabase().from('invoices').select('*');
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.subscription_id) query = query.eq('subscription_id', filters.subscription_id);

      const { data: invoices, error } = await query.order('id', { ascending: false });
      if (error) throw new Error(error.message);

      const customers = await CustomerModel.getAll();
      const custMap = {};
      customers.forEach(c => custMap[c.id] = c);

      let list = (invoices || []).map(inv => this.formatInvoice(inv, custMap[inv.customer_id]));
      if (filters.overdue) {
        list = list.filter(i => i.is_overdue);
      }
      return list;
    }

    let sql = `
      SELECT i.*, c.email as customer_email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
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
    return res.rows.map(r => this.formatInvoice(r, { email: r.customer_email }));
  },

  async findById(id) {
    if (db.isSupabase()) {
      const { data: inv, error } = await db.getSupabase()
        .from('invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !inv) return null;
      const cust = await CustomerModel.findById(inv.customer_id);
      return this.formatInvoice(inv, cust);
    }

    const res = await db.query(`
      SELECT i.*, c.email as customer_email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    return this.formatInvoice(res.rows[0], { email: res.rows[0].customer_email });
  },

  async create({ subscription_id = null, customer_id, status = 'Confirmed', subtotal = 0, tax_amount = 0, total_amount, due_date }) {
    const due = due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          subscription_id: subscription_id ? parseInt(subscription_id) : null,
          customer_id: parseInt(customer_id),
          status,
          subtotal: parseFloat(subtotal),
          tax_amount: parseFloat(tax_amount),
          total_amount: parseFloat(total_amount),
          amount_paid: 0,
          amount_due: parseFloat(total_amount),
          due_date: due
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return this.findById(data.id);
    }

    const res = await db.query(`
      INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_amount, total_amount, amount_paid, amount_due, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [invoiceNumber, subscription_id, customer_id, status, subtotal, tax_amount, total_amount, 0, total_amount, due]);

    return this.findById(res.lastID);
  },

  async updateStatus(id, newStatus) {
    if (db.isSupabase()) {
      const { error } = await db.getSupabase()
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return this.findById(id);
    }

    await db.query('UPDATE invoices SET status = $1 WHERE id = $2', [newStatus, id]);
    return this.findById(id);
  }
};

module.exports = InvoiceModel;
