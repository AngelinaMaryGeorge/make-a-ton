const db = require('../config/db');

const SubscriptionModel = {
  async getAll(filters = {}) {
    let sql = `
      SELECT s.*, 
             c.name as customer_name, c.email as customer_email, c.company as customer_company,
             p.name as plan_name, p.billing_frequency, p.allow_pause, p.auto_close
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`s.status = $${params.length}`);
    }
    if (filters.customer_id) {
      params.push(filters.customer_id);
      conditions.push(`s.customer_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY s.id DESC';

    const res = await db.query(sql, params);
    
    // Fetch items for each subscription
    const subs = res.rows;
    for (const sub of subs) {
      const itemsRes = await db.query(`
        SELECT si.*, pr.name as product_name
        FROM subscription_items si
        JOIN products pr ON si.product_id = pr.id
        WHERE si.subscription_id = $1
      `, [sub.id]);
      sub.items = itemsRes.rows.map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        amount: parseFloat(item.amount)
      }));
      sub.total_amount = sub.items.reduce((sum, it) => sum + it.amount, 0);
    }
    return subs;
  },

  async findById(id) {
    const res = await db.query(`
      SELECT s.*, 
             c.name as customer_name, c.email as customer_email, c.company as customer_company,
             p.name as plan_name, p.billing_frequency, p.allow_pause, p.auto_close
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const sub = res.rows[0];

    const itemsRes = await db.query(`
      SELECT si.*, pr.name as product_name
      FROM subscription_items si
      JOIN products pr ON si.product_id = pr.id
      WHERE si.subscription_id = $1
    `, [id]);

    sub.items = itemsRes.rows.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      tax_rate: parseFloat(item.tax_rate),
      amount: parseFloat(item.amount)
    }));
    sub.total_amount = sub.items.reduce((sum, it) => sum + it.amount, 0);
    return sub;
  },

  async create({ customer_id, plan_id, quote_id = null, status = 'Draft', start_date, expiry_date = null, payment_terms = 'Immediate', notes = '', items = [] }) {
    // Generate clean subscription number
    const countRes = await db.query('SELECT COUNT(*) as count FROM subscriptions');
    const seq = parseInt(countRes.rows[0]?.count || 0) + 1;
    const subscription_number = `SUB-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    // Calculate initial next billing date
    const next_billing_date = start_date;

    const res = await db.query(`
      INSERT INTO subscriptions (subscription_number, customer_id, plan_id, quote_id, status, start_date, expiry_date, next_billing_date, payment_terms, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [subscription_number, customer_id, plan_id, quote_id, status, start_date, expiry_date, next_billing_date, payment_terms, notes]);

    const subId = res.lastID;

    // Insert items
    for (const item of items) {
      const lineAmount = (item.quantity || 1) * (item.unit_price || 0);
      await db.query(`
        INSERT INTO subscription_items (subscription_id, product_id, variant_id, variant_name, quantity, unit_price, tax_rate, amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [subId, item.product_id, item.variant_id || null, item.variant_name || null, item.quantity || 1, item.unit_price, item.tax_rate || 18.00, lineAmount]);
    }

    return this.findById(subId);
  },

  async updateStatus(id, newStatus) {
    const sub = await this.findById(id);
    if (!sub) throw new Error('Subscription not found');

    const validTransitions = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition to: ${newStatus}`);
    }

    // Check pause rules
    if (newStatus === 'Paused' && !sub.allow_pause) {
      throw new Error('This plan does not permit pausing');
    }

    await db.query('UPDATE subscriptions SET status = $1 WHERE id = $2', [newStatus, id]);
    return this.findById(id);
  },

  async advanceBillingDate(id, currentBillingDate, frequency) {
    const curr = new Date(currentBillingDate || new Date());
    let nextDate = new Date(curr);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(curr.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(curr.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(curr.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(curr.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(curr.getMonth() + 1);
    }

    const nextStr = nextDate.toISOString().split('T')[0];
    const lastStr = curr.toISOString().split('T')[0];

    await db.query(
      'UPDATE subscriptions SET last_billing_date = $1, next_billing_date = $2 WHERE id = $3',
      [lastStr, nextStr, id]
    );
  }
};

module.exports = SubscriptionModel;
