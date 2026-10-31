const db = require('../config/db');

const CustomerModel = {
  async findById(id) {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        name: data.name || data.email.split('@')[0],
        company: data.company || '',
        phone: data.phone || ''
      };
    }

    const res = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      name: r.name || r.email.split('@')[0],
      company: r.company || '',
      phone: r.phone || ''
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
        name: data.name || data.email.split('@')[0],
        company: data.company || '',
        phone: data.phone || ''
      };
    }

    const res = await db.query('SELECT * FROM customers WHERE email = $1', [cleanEmail]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      name: r.name || r.email.split('@')[0],
      company: r.company || '',
      phone: r.phone || ''
    };
  },

  async create({ name, email, passwordHash, role = 'customer', company = '', phone = '' }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split('@')[0];

    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('customers')
        .insert([{
          name: cleanName,
          email: cleanEmail,
          password_hash: passwordHash,
          role,
          company: company || '',
          phone: phone || ''
        }])
        .select()
        .single();
      if (error) {
        // Fallback for schemas with only email & password_hash
        const { data: fallbackData, error: fbError } = await db.getSupabase()
          .from('customers')
          .insert([{ email: cleanEmail, password_hash: passwordHash, role }])
          .select()
          .single();
        if (fbError) throw new Error(fbError.message);
        return {
          ...fallbackData,
          name: cleanName,
          company,
          phone
        };
      }
      return {
        ...data,
        name: data.name || cleanName,
        company: data.company || company,
        phone: data.phone || phone
      };
    }

    try {
      const res = await db.query(
        'INSERT INTO customers (name, email, password_hash, role, company, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        [cleanName, cleanEmail, passwordHash, role, company || '', phone || '']
      );
      const newId = res.lastID || (await this.findByEmail(cleanEmail))?.id;
      return this.findById(newId);
    } catch (err) {
      // If table lacks name column in legacy DB
      const res = await db.query(
        'INSERT INTO customers (email, password_hash, role) VALUES ($1, $2, $3)',
        [cleanEmail, passwordHash, role]
      );
      const newId = res.lastID || (await this.findByEmail(cleanEmail))?.id;
      return this.findById(newId);
    }
  },

  async getAll(roleFilter = null) {
    if (db.isSupabase()) {
      let query = db.getSupabase().from('customers').select('*');
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(c => ({
        ...c,
        name: c.name || c.email.split('@')[0],
        company: c.company || '',
        phone: c.phone || ''
      }));
    }

    let sql = 'SELECT * FROM customers';
    const params = [];
    if (roleFilter) {
      sql += ' WHERE role = $1';
      params.push(roleFilter);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.query(sql, params);
    return res.rows.map(c => ({
      ...c,
      name: c.name || c.email.split('@')[0],
      company: c.company || '',
      phone: c.phone || ''
    }));
  },

  async getClientsWithStats() {
    const clients = await this.getAll('customer');
    
    // Attach subscriptions and invoices counts
    for (const client of clients) {
      try {
        const subRes = await db.query(
          'SELECT COUNT(*) as count FROM subscriptions WHERE customer_id = $1',
          [client.id]
        );
        client.subscriptions_count = parseInt(subRes.rows[0]?.count || 0);

        const activeSubRes = await db.query(
          "SELECT COUNT(*) as count FROM subscriptions WHERE customer_id = $1 AND status = 'Active'",
          [client.id]
        );
        client.active_subscriptions_count = parseInt(activeSubRes.rows[0]?.count || 0);

        const invRes = await db.query(
          'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_billed FROM invoices WHERE customer_id = $1',
          [client.id]
        );
        client.invoices_count = parseInt(invRes.rows[0]?.count || 0);
        client.total_billed = parseFloat(invRes.rows[0]?.total_billed || 0);
      } catch (e) {
        client.subscriptions_count = 0;
        client.active_subscriptions_count = 0;
        client.invoices_count = 0;
        client.total_billed = 0;
      }
    }

    return clients;
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
