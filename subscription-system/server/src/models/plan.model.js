const db = require('../config/db');
const ProductModel = require('./product.model');

const PlanModel = {
  async getAll() {
    if (db.isSupabase()) {
      const { data: plansData, error } = await db.getSupabase()
        .from('plans')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw new Error(error.message);

      const products = await ProductModel.getAll();
      const productMap = {};
      products.forEach(p => productMap[p.id] = p);

      return (plansData || []).map(p => {
        const prod = productMap[p.product_id] || {};
        return {
          ...p,
          product_name: prod.name || 'Software Subscription',
          price: prod.sales_price || 0,
          name: `${prod.name || 'Plan'} - ${p.billing_frequency?.toUpperCase()}`,
          auto_close: Boolean(p.auto_close),
          allow_pause: Boolean(p.allow_pause)
        };
      });
    }

    const res = await db.query(`
      SELECT p.*, pr.name as product_name, pr.sales_price as price
      FROM plans p
      LEFT JOIN products pr ON p.product_id = pr.id
      ORDER BY p.id ASC
    `);

    return res.rows.map(r => ({
      ...r,
      price: parseFloat(r.price || 0),
      name: `${r.product_name || 'Plan'} - ${r.billing_frequency?.toUpperCase()}`,
      auto_close: Boolean(r.auto_close),
      allow_pause: Boolean(r.allow_pause)
    }));
  },

  async findById(id) {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('plans')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;

      const prod = await ProductModel.findById(data.product_id);
      return {
        ...data,
        product_name: prod?.name || 'Software Subscription',
        price: prod?.sales_price || 0,
        name: `${prod?.name || 'Plan'} - ${data.billing_frequency?.toUpperCase()}`,
        auto_close: Boolean(data.auto_close),
        allow_pause: Boolean(data.allow_pause)
      };
    }

    const res = await db.query(`
      SELECT p.*, pr.name as product_name, pr.sales_price as price
      FROM plans p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      price: parseFloat(r.price || 0),
      name: `${r.product_name || 'Plan'} - ${r.billing_frequency?.toUpperCase()}`,
      auto_close: Boolean(r.auto_close),
      allow_pause: Boolean(r.allow_pause)
    };
  },

  async create(productId, { billing_frequency, min_quantity = 1, start_date = null, end_date = null, auto_close = false, allow_pause = true }) {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('plans')
        .insert([{
          product_id: parseInt(productId),
          billing_frequency,
          min_quantity: parseInt(min_quantity || 1),
          start_date: start_date || null,
          end_date: end_date || null,
          auto_close: Boolean(auto_close),
          allow_pause: Boolean(allow_pause)
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return this.findById(data.id);
    }

    const res = await db.query(`
      INSERT INTO plans (product_id, billing_frequency, min_quantity, start_date, end_date, auto_close, allow_pause)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      productId,
      billing_frequency,
      min_quantity,
      start_date,
      end_date,
      auto_close ? 1 : 0,
      allow_pause ? 1 : 0
    ]);

    return this.findById(res.lastID);
  }
};

module.exports = PlanModel;
