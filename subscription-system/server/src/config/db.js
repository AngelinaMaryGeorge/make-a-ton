const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Ensure .env is loaded from workspace root, server dir, or current directory
[
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env')
].forEach(envPath => {
  try {
    dotenv.config({ path: envPath, override: false });
  } catch (e) {}
});

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;
let sqliteDb = null;
let isSupabaseActive = false;

const DB_PATH = path.join(__dirname, '../../database/brightloop.sqlite');
const MIGRATION_PATH = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
const SEED_PATH = path.join(__dirname, '../../database/seeds/initial_seed.sql');

async function initDb() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();

  // 1. Check if Supabase credentials are provided
  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      // Test connectivity by querying customers table
      const { data, error } = await supabaseClient.from('customers').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Supabase test query notice:', error.message);
      }

      isSupabaseActive = true;
      console.log(`✅ Connected to Supabase at: ${supabaseUrl}`);
      await seedDefaultSupabaseData();
      return;
    } catch (err) {
      console.warn('⚠️ Supabase connection failed, falling back to embedded SQLite:', err.message);
    }
  }

  // 2. Fallback to embedded SQLite
  await initSqlite();
}

function initSqlite() {
  return new Promise((resolve, reject) => {
    const sqlite3 = require('sqlite3').verbose();
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    sqliteDb = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error('❌ Failed to connect to SQLite:', err.message);
        return reject(err);
      }
      console.log(`✅ Connected to SQLite database at ${DB_PATH}`);
      try {
        await runSqliteMigrations();
        await seedDefaultUsers();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

function runSqliteMigrations() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(MIGRATION_PATH)) return resolve();
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
    sqliteDb.exec(sql, (err) => {
      if (err) {
        console.error('Migration error:', err);
        return reject(err);
      }
      resolve();
    });
  });
}

async function seedDefaultSupabaseData() {
  try {
    const { data: existingAdmin } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', 'admin@brightloop.com')
      .maybeSingle();

    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('AdminPass1!', 10);
      const staffHash = await bcrypt.hash('SecurePass1!', 10);
      const custHash = await bcrypt.hash('SecurePass1!', 10);

      await supabaseClient.from('customers').insert([
        { email: 'admin@brightloop.com', password_hash: adminHash, role: 'admin' },
        { email: 'staff@brightloop.com', password_hash: staffHash, role: 'staff' },
        { email: 'customer@example.com', password_hash: custHash, role: 'customer' }
      ]);
    }

    // Check if products exist
    const { data: prods } = await supabaseClient.from('products').select('id').limit(1);
    if (!prods || prods.length === 0) {
      await supabaseClient.from('products').insert([
        {
          name: 'ERP Cloud Suite',
          type: 'software',
          sales_price: 1000.00,
          cost_price: 200.00,
          variant_metadata: [{ brand: 'Odoo', price_modifier: 560 }, { brand: 'Standard', price_modifier: 0 }],
          notes: 'Flagship cloud enterprise resource planning suite'
        },
        {
          name: 'Analytics AI Pro',
          type: 'add-on',
          sales_price: 350.00,
          cost_price: 50.00,
          variant_metadata: [{ tier: 'Pro', price_modifier: 150 }],
          notes: 'Advanced business intelligence engine'
        }
      ]);
    }

    // Check if plans exist
    const { data: plans } = await supabaseClient.from('plans').select('id').limit(1);
    if (!plans || plans.length === 0) {
      // Find the first product id
      const { data: prodList } = await supabaseClient.from('products').select('id').limit(1);
      const prodId = prodList?.[0]?.id || 1;
      await supabaseClient.from('plans').insert([
        {
          product_id: prodId,
          billing_frequency: 'monthly',
          min_quantity: 1,
          start_date: '2026-01-01',
          auto_close: false,
          allow_pause: true
        },
        {
          product_id: prodId,
          billing_frequency: 'yearly',
          min_quantity: 1,
          start_date: '2026-01-01',
          auto_close: false,
          allow_pause: true
        }
      ]);
    }
  } catch (err) {
    console.warn('Supabase initial seed notice:', err.message);
  }
}

async function seedDefaultUsers() {
  const users = [
    { email: 'admin@brightloop.com', password: 'AdminPass1!', role: 'admin' },
    { email: 'staff@brightloop.com', password: 'SecurePass1!', role: 'staff' },
    { email: 'customer@example.com', password: 'SecurePass1!', role: 'customer' }
  ];

  for (const u of users) {
    const existing = await query('SELECT id FROM customers WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await query(
        'INSERT INTO customers (email, password_hash, role) VALUES ($1, $2, $3)',
        [u.email, hash, u.role]
      );
    }
  }

  // Seed sample products if none
  const existingProd = await query('SELECT id FROM products LIMIT 1');
  if (existingProd.rows.length === 0) {
    await query(`
      INSERT INTO products (name, type, sales_price, cost_price, variant_metadata, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'ERP Cloud Suite',
      'software',
      1000.00,
      200.00,
      JSON.stringify([{ brand: 'Odoo', price_modifier: 560 }, { brand: 'Standard', price_modifier: 0 }]),
      'Flagship cloud ERP'
    ]);

    await query(`
      INSERT INTO plans (product_id, billing_frequency, min_quantity, start_date, end_date, auto_close, allow_pause)
      VALUES (1, 'monthly', 1, '2026-01-01', '2027-12-31', 0, 1)
    `);

    await query(`
      INSERT INTO subscriptions (subscription_number, customer_id, plan_id, status, start_date, expiry_date, payment_terms)
      VALUES ('SUB-2026-0001', 3, 1, 'Active', '2026-01-01', '2027-01-01', 'Net 30')
    `);

    await query(`
      INSERT INTO invoices (subscription_id, customer_id, status, subtotal, tax_amount, total_amount, due_date)
      VALUES (1, 3, 'Paid', 1560.00, 280.80, 1840.80, '2026-01-31')
    `);

    await query(`
      INSERT INTO payments (invoice_id, amount, method, notes)
      VALUES (1, 1840.80, 'bank_transfer', 'Payment ref #WT-88910')
    `);
  }

  // Seed default discounts if table exists and is empty
  try {
    const existingDisc = await query('SELECT id FROM discounts LIMIT 1');
    if (existingDisc.rows.length === 0) {
      await query(`
        INSERT INTO discounts (code, name, type, amount, min_purchase, min_quantity, usage_limit, used_count, start_date, end_date, is_active)
        VALUES 
        ('GROWTH15', '15% Volume Seat Discount', 'percentage', 15.00, 2000.00, 5, 100, 3, '2026-01-01', '2027-12-31', 1),
        ('WELCOME200', 'Flat $200 First Plan Credit', 'fixed', 200.00, 1000.00, 1, 50, 12, '2026-01-01', '2027-12-31', 1)
      `);
    }
  } catch (e) {
    // discounts table might not exist in plain schema
  }
}

// Unified query wrapper supporting SQLite
function query(text, params = []) {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      return reject(new Error('SQLite database not initialized yet.'));
    }

    const sqliteSql = text.replace(/\$(\d+)/g, '?');
    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);

    if (isSelect) {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        resolve({
          rows: [],
          rowCount: this.changes,
          lastID: this.lastID
        });
      });
    }
  });
}

module.exports = {
  initDb,
  query,
  getSupabase: () => supabaseClient,
  isSupabase: () => isSupabaseActive
};
