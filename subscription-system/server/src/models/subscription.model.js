const db = require('../config/db');
const PlanModel = require('./plan.model');
const CustomerModel = require('./customer.model');

const SubscriptionModel = {
  async getAll(filters = {}) {
    if (db.isSupabase()) {
      let query = db.getSupabase().from('subscriptions').select('*');
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);

      const { data: subs, error } = await query.order('id', { ascending: false });
      if (error) throw new Error(error.message);

      const plans = await PlanModel.getAll();
      const planMap = {};
      plans.forEach(p => planMap[p.id] = p);

      const customers = await CustomerModel.getAll();
      const custMap = {};
      customers.forEach(c => custMap[c.id] = c);

      return (subs || []).map(s => {
        const pl = planMap[s.plan_id] || {};
        const cust = custMap[s.customer_id] || {};
        return {
          ...s,
          customer_name: cust.name || cust.email?.split('@')[0] || `Customer #${s.customer_id}`,
          customer_email: cust.email || '',
          customer_company: cust.company || '',
          plan_name: pl.name || `Plan #${s.plan_id}`,
          billing_frequency: pl.billing_frequency || 'monthly',
          allow_pause: pl.allow_pause !== false,
          auto_close: pl.auto_close || false,
          total_amount: pl.price || 1000.00,
          items: [
            {
              product_id: pl.product_id || 1,
              product_name: pl.product_name || 'Software Subscription',
              quantity: pl.min_quantity || 1,
              unit_price: pl.price || 1000.00,
              amount: pl.price || 1000.00
            }
          ]
        };
      });
    }

    let sql = `
      SELECT s.*, 
             c.email as customer_email,
             p.billing_frequency, p.auto_close, p.allow_pause,
             pr.name as product_name, pr.sales_price as plan_price
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
      LEFT JOIN products pr ON p.product_id = pr.id
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
    return res.rows.map(s => ({
      ...s,
      customer_name: s.customer_email.split('@')[0],
      customer_company: '',
      plan_name: `${s.product_name || 'Plan'} - ${s.billing_frequency?.toUpperCase()}`,
      allow_pause: Boolean(s.allow_pause),
      auto_close: Boolean(s.auto_close),
      total_amount: parseFloat(s.plan_price || 1000),
      items: [
        {
          product_id: 1,
          product_name: s.product_name || 'Software Subscription',
          quantity: 1,
          unit_price: parseFloat(s.plan_price || 1000),
          amount: parseFloat(s.plan_price || 1000)
        }
      ]
    }));
  },

  async findById(id) {
    if (db.isSupabase()) {
      const { data: s, error } = await db.getSupabase()
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !s) return null;

      const pl = await PlanModel.findById(s.plan_id);
      const cust = await CustomerModel.findById(s.customer_id);

      return {
        ...s,
        customer_name: cust?.name || cust?.email?.split('@')[0] || `Customer #${s.customer_id}`,
        customer_email: cust?.email || '',
        customer_company: cust?.company || '',
        plan_name: pl?.name || `Plan #${s.plan_id}`,
        billing_frequency: pl?.billing_frequency || 'monthly',
        allow_pause: pl?.allow_pause !== false,
        auto_close: pl?.auto_close || false,
        total_amount: pl?.price || 1000.00,
        items: [
          {
            product_id: pl?.product_id || 1,
            product_name: pl?.product_name || 'Software Subscription',
            quantity: pl?.min_quantity || 1,
            unit_price: pl?.price || 1000.00,
            amount: pl?.price || 1000.00
          }
        ]
      };
    }

    const res = await db.query(`
      SELECT s.*, 
             c.email as customer_email,
             p.billing_frequency, p.auto_close, p.allow_pause,
             pr.name as product_name, pr.sales_price as plan_price
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN plans p ON s.plan_id = p.id
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE s.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const s = res.rows[0];
    return {
      ...s,
      customer_name: s.customer_email.split('@')[0],
      customer_company: '',
      plan_name: `${s.product_name || 'Plan'} - ${s.billing_frequency?.toUpperCase()}`,
      allow_pause: Boolean(s.allow_pause),
      auto_close: Boolean(s.auto_close),
      total_amount: parseFloat(s.plan_price || 1000),
      items: [
        {
          product_id: 1,
          product_name: s.product_name || 'Software Subscription',
          quantity: 1,
          unit_price: parseFloat(s.plan_price || 1000),
          amount: parseFloat(s.plan_price || 1000)
        }
      ]
    };
  },

  async create({ customer_id, plan_id, status = 'Draft', start_date, expiry_date = null, payment_terms = 'Net 30' }) {
    const subNumber = `SUB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('subscriptions')
        .insert([{
          subscription_number: subNumber,
          customer_id: parseInt(customer_id),
          plan_id: parseInt(plan_id),
          status,
          start_date,
          expiry_date: expiry_date || null,
          payment_terms
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return this.findById(data.id);
    }

    const res = await db.query(`
      INSERT INTO subscriptions (subscription_number, customer_id, plan_id, status, start_date, expiry_date, payment_terms)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [subNumber, customer_id, plan_id, status, start_date, expiry_date, payment_terms]);

    return this.findById(res.lastID);
  },

  async updateStatus(id, newStatus) {
    if (db.isSupabase()) {
      const { error } = await db.getSupabase()
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return this.findById(id);
    }

    await db.query('UPDATE subscriptions SET status = $1 WHERE id = $2', [newStatus, id]);
    return this.findById(id);
  },

  async advanceBillingDate(id, currentBillingDate, frequency) {
    // Keep subscription active and update start_date / expiry_date
    const curr = new Date(currentBillingDate || new Date());
    let nextDate = new Date(curr);
    if (frequency === 'yearly') nextDate.setFullYear(curr.getFullYear() + 1);
    else if (frequency === 'weekly') nextDate.setDate(curr.getDate() + 7);
    else if (frequency === 'daily') nextDate.setDate(curr.getDate() + 1);
    else nextDate.setMonth(curr.getMonth() + 1);

    const nextStr = nextDate.toISOString().split('T')[0];
    if (db.isSupabase()) {
      await db.getSupabase()
        .from('subscriptions')
        .update({ start_date: nextStr })
        .eq('id', id);
    } else {
      await db.query('UPDATE subscriptions SET start_date = $1 WHERE id = $2', [nextStr, id]);
    }
  }
};

module.exports = SubscriptionModel;
