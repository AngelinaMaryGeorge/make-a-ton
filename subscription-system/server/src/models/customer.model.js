const db = require('../config/db');

const CustomerModel = {
  async findById(id) {
    const res = await db.query('SELECT id, name, email, role, company, phone, created_at FROM customers WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const res = await db.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'customer', company = '', phone = '' }) {
    const res = await db.query(
      `INSERT INTO customers (name, email, password_hash, role, company, phone)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email.toLowerCase().trim(), passwordHash, role, company, phone]
    );
    const newId = res.lastID || (await this.findByEmail(email))?.id;
    return this.findById(newId);
  },

  async getAll(roleFilter = null) {
    let sql = 'SELECT id, name, email, role, company, phone, created_at FROM customers';
    const params = [];
    if (roleFilter) {
      sql += ' WHERE role = $1';
      params.push(roleFilter);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.query(sql, params);
    return res.rows;
  },

  async updateResetToken(email, token, expiresAt) {
    await db.query(
      'UPDATE customers SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expiresAt, email.toLowerCase().trim()]
    );
  },

  async resetPasswordWithToken(token, newPasswordHash) {
    const res = await db.query(
      'SELECT id FROM customers WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
      [token]
    );
    if (res.rows.length === 0) return false;
    const customerId = res.rows[0].id;
    await db.query(
      'UPDATE customers SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [newPasswordHash, customerId]
    );
    return true;
  }
};

module.exports = CustomerModel;
