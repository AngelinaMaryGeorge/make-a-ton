const db = require('../config/db');

const DiscountModel = {
  async getAll() {
    const res = await db.query(`
      SELECT d.*, p.name as applicable_product_name
      FROM discounts d
      LEFT JOIN products p ON d.applicable_product_id = p.id
      ORDER BY d.id DESC
    `);
    return res.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      min_purchase: parseFloat(r.min_purchase || 0),
      is_active: Boolean(r.is_active)
    }));
  },

  async findById(id) {
    const res = await db.query('SELECT * FROM discounts WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      amount: parseFloat(r.amount),
      min_purchase: parseFloat(r.min_purchase || 0),
      is_active: Boolean(r.is_active)
    };
  },

  async findByCode(code) {
    if (!code) return null;
    const res = await db.query('SELECT * FROM discounts WHERE code = $1 AND is_active = 1', [code.trim().toUpperCase()]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      amount: parseFloat(r.amount),
      min_purchase: parseFloat(r.min_purchase || 0),
      is_active: Boolean(r.is_active)
    };
  },

  async create({ code, name, type, amount, min_purchase = 0, min_quantity = 0, usage_limit = 100, start_date = null, end_date = null, applicable_product_id = null }) {
    let discountCode = code;
    if (!discountCode) {
      discountCode = `DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    let discountName = name;
    if (!discountName) {
      discountName = type === 'percentage' ? `${amount}% Discount Rule` : `$${amount} Flat Discount Rule`;
    }

    const res = await db.query(`
      INSERT INTO discounts (code, name, type, amount, min_purchase, min_quantity, usage_limit, used_count, start_date, end_date, applicable_product_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, 1)
    `, [
      discountCode.toUpperCase(),
      discountName,
      type,
      amount,
      min_purchase,
      min_quantity,
      usage_limit,
      start_date,
      end_date,
      applicable_product_id
    ]);

    return this.findById(res.lastID);
  },

  async incrementUsage(id) {
    await db.query(`
      UPDATE discounts 
      SET used_count = used_count + 1,
          is_active = CASE WHEN used_count + 1 >= usage_limit THEN 0 ELSE is_active END
      WHERE id = $1
    `, [id]);
  }
};

module.exports = DiscountModel;
