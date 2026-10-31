const db = require('../config/db');

const CustomerModel = {
  async findById(id) {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('customers')
        .select('id, email, role, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        name: data.email.split('@')[0],
        company: ''
      };
    }

    const res = await db.query('SELECT id, email, role, created_at FROM customers WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      name: r.email.split('@')[0],
      company: ''
    };
  },

  async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('customers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        name: data.email.split('@')[0],
        company: ''
      };
    }

    const res = await db.query('SELECT * FROM customers WHERE email = $1', [cleanEmail]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      name: r.email.split('@')[0],
      company: ''
    };
  },

  async create({ email, passwordHash, role = 'customer' }) {
    const cleanEmail = email.toLowerCase().trim();
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('customers')
        .insert([{ email: cleanEmail, password_hash: passwordHash, role }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        name: data.email.split('@')[0],
        company: ''
      };
    }

    const res = await db.query(
      'INSERT INTO customers (email, password_hash, role) VALUES ($1, $2, $3)',
      [cleanEmail, passwordHash, role]
    );
    const newId = res.lastID || (await this.findByEmail(cleanEmail))?.id;
    return this.findById(newId);
  },

  async getAll(roleFilter = null) {
    if (db.isSupabase()) {
      let query = db.getSupabase().from('customers').select('id, email, role, created_at');
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(c => ({
        ...c,
        name: c.email.split('@')[0],
        company: ''
      }));
    }

    let sql = 'SELECT id, email, role, created_at FROM customers';
    const params = [];
    if (roleFilter) {
      sql += ' WHERE role = $1';
      params.push(roleFilter);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.query(sql, params);
    return res.rows.map(c => ({
      ...c,
      name: c.email.split('@')[0],
      company: ''
    }));
  },

  async resetPassword(email, newPasswordHash) {
    const cleanEmail = email.toLowerCase().trim();
    if (db.isSupabase()) {
      const { error } = await db.getSupabase()
        .from('customers')
        .update({ password_hash: newPasswordHash })
        .eq('email', cleanEmail);
      return !error;
    }

    const res = await db.query(
      'UPDATE customers SET password_hash = $1 WHERE email = $2',
      [newPasswordHash, cleanEmail]
    );
    return res.rowCount > 0;
  }
};

module.exports = CustomerModel;
