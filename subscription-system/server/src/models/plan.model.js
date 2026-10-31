const db = require('../config/db');

const PlanModel = {
  async getAll() {
    const res = await db.query(`
      SELECT p.*, pr.name as product_name, pr.sales_price as base_product_price
      FROM plans p
      LEFT JOIN products pr ON p.product_id = pr.id
      ORDER BY p.id ASC
    `);
    return res.rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      auto_close: Boolean(r.auto_close),
      allow_pause: Boolean(r.allow_pause)
    }));
  },

  async findById(id) {
    const res = await db.query(`
      SELECT p.*, pr.name as product_name, pr.sales_price as base_product_price
      FROM plans p
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE p.id = $1
    `, [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      price: parseFloat(r.price),
      auto_close: Boolean(r.auto_close),
      allow_pause: Boolean(r.allow_pause)
    };
  },

  async getByProductId(productId) {
    const res = await db.query('SELECT * FROM plans WHERE product_id = $1 ORDER BY id ASC', [productId]);
    return res.rows.map(r => ({
      ...r,
      price: parseFloat(r.price),
      auto_close: Boolean(r.auto_close),
      allow_pause: Boolean(r.allow_pause)
    }));
  },

  async create(productId, { name, billing_frequency, price, min_quantity = 1, start_date = null, end_date = null, auto_close = false, allow_pause = true }) {
    // If name is not provided, generate a descriptive name
    let planName = name;
    if (!planName) {
      planName = `Plan - ${billing_frequency.toUpperCase()}`;
    }

    // Default price to product sales price if not supplied
    let planPrice = price;
    if (planPrice === undefined || planPrice === null) {
      const prodRes = await db.query('SELECT sales_price FROM products WHERE id = $1', [productId]);
      planPrice = prodRes.rows[0]?.sales_price || 0;
    }

    const res = await db.query(
      `INSERT INTO plans (product_id, name, billing_frequency, price, min_quantity, start_date, end_date, auto_close, allow_pause)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        productId,
        planName,
        billing_frequency,
        planPrice,
        min_quantity,
        start_date,
        end_date,
        auto_close ? 1 : 0,
        allow_pause ? 1 : 0
      ]
    );
    return this.findById(res.lastID);
  }
};

module.exports = PlanModel;
