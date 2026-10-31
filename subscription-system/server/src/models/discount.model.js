const db = require('../config/db');

// In-memory store for Supabase mode (as discounts table is not part of the standard 6 Supabase tables)
let memDiscounts = [
  {
    id: 1,
    code: 'WELCOME10',
    name: '10% Welcome Discount',
    type: 'percentage',
    amount: 10,
    min_purchase: 0,
    min_quantity: 1,
    usage_limit: 500,
    used_count: 0,
    start_date: null,
    end_date: null,
    applicable_product_id: null,
    is_active: true
  },
  {
    id: 2,
    code: 'EARLYBIRD20',
    name: '20% Early Bird',
    type: 'percentage',
    amount: 20,
    min_purchase: 500,
    min_quantity: 2,
    usage_limit: 100,
    used_count: 0,
    start_date: null,
    end_date: null,
    applicable_product_id: null,
    is_active: true
  },
  {
    id: 3,
    code: 'ODOO50',
    name: '$50 Flat Promo',
    type: 'fixed',
    amount: 50,
    min_purchase: 200,
    min_quantity: 1,
    usage_limit: 100,
    used_count: 0,
    start_date: null,
    end_date: null,
    applicable_product_id: null,
    is_active: true
  },
  {
    id: 4,
    code: 'GROWTH15',
    name: '15% Growth Discount',
    type: 'percentage',
    amount: 15,
    min_purchase: 2000,
    min_quantity: 5,
    usage_limit: 100,
    used_count: 0,
    start_date: null,
    end_date: null,
    applicable_product_id: null,
    is_active: true
  }
];

const DiscountModel = {
  async getAll() {
    if (db.isSupabase()) {
      return memDiscounts.map(d => ({ ...d }));
    }
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
    if (db.isSupabase()) {
      const found = memDiscounts.find(d => d.id === Number(id));
      return found ? { ...found } : null;
    }
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
    const normalized = code.trim().toUpperCase();
    if (db.isSupabase()) {
      const found = memDiscounts.find(d => d.code === normalized && d.is_active);
      return found ? { ...found } : null;
    }
    const res = await db.query('SELECT * FROM discounts WHERE code = $1 AND is_active = 1', [normalized]);
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

    if (db.isSupabase()) {
      const newDisc = {
        id: memDiscounts.length > 0 ? Math.max(...memDiscounts.map(d => d.id)) + 1 : 1,
        code: discountCode.toUpperCase(),
        name: discountName,
        type,
        amount: parseFloat(amount),
        min_purchase: parseFloat(min_purchase || 0),
        min_quantity: parseInt(min_quantity || 0, 10),
        usage_limit: parseInt(usage_limit || 100, 10),
        used_count: 0,
        start_date,
        end_date,
        applicable_product_id,
        is_active: true
      };
      memDiscounts.push(newDisc);
      return { ...newDisc };
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
    if (db.isSupabase()) {
      const item = memDiscounts.find(d => d.id === Number(id));
      if (item) {
        item.used_count += 1;
        if (item.used_count >= item.usage_limit) {
          item.is_active = false;
        }
      }
      return;
    }
    await db.query(`
      UPDATE discounts 
      SET used_count = used_count + 1,
          is_active = CASE WHEN used_count + 1 >= usage_limit THEN 0 ELSE is_active END
      WHERE id = $1
    `, [id]);
  }
};

module.exports = DiscountModel;
