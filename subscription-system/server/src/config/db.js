const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;
let sqliteDb = null;
let isPostgres = false;

const DB_PATH = path.join(__dirname, '../../database/brightloop.sqlite');
const MIGRATION_PATH = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
const SEED_PATH = path.join(__dirname, '../../database/seeds/initial_seed.sql');

// Initialize database
async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;

  // Try PostgreSQL if DATABASE_URL or DB_HOST is explicitly configured and not default dummy
  if (databaseUrl && !databaseUrl.includes('postgres:postgres@localhost:5432')) {
    try {
      const { Pool } = require('pg');
      pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });
      const client = await pool.connect();
      client.release();
      isPostgres = true;
      console.log('✅ Connected to PostgreSQL database');
      await runPostgresMigrations();
      await seedDefaultUsers();
      return;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to embedded SQLite:', err.message);
    }
  }

  // SQLite Fallback
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
      console.log('✅ SQLite schema migration applied.');

      if (fs.existsSync(SEED_PATH)) {
        const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
        sqliteDb.exec(seedSql, (seedErr) => {
          if (seedErr) {
            console.warn('Seed execution note:', seedErr.message);
          } else {
            console.log('✅ Initial seeds inserted.');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

async function runPostgresMigrations() {
  if (!fs.existsSync(MIGRATION_PATH)) return;
  let sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  // Adjust AUTOINCREMENT and DATETIME for PG
  sql = sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    .replace(/DATETIME/gi, 'TIMESTAMP')
    .replace(/INSERT OR IGNORE/gi, 'INSERT')
    .replace(/BOOLEAN DEFAULT 0/gi, 'BOOLEAN DEFAULT FALSE')
    .replace(/BOOLEAN DEFAULT 1/gi, 'BOOLEAN DEFAULT TRUE');
  
  try {
    await pool.query(sql);
    console.log('✅ PostgreSQL schema migrations applied.');
  } catch (err) {
    console.warn('PG migration warning (tables may already exist):', err.message);
  }
}

async function seedDefaultUsers() {
  const users = [
    {
      name: 'System Admin',
      email: 'admin@brightloop.com',
      password: 'AdminPass1!',
      role: 'admin',
      company: 'Brightloop Software'
    },
    {
      name: 'Sarah Staff',
      email: 'staff@brightloop.com',
      password: 'SecurePass1!',
      role: 'staff',
      company: 'Brightloop Internal'
    },
    {
      name: 'Acme Corporation',
      email: 'customer@example.com',
      password: 'SecurePass1!',
      role: 'customer',
      company: 'Acme Corp'
    },
    {
      name: 'Zenith Labs',
      email: 'zenith@example.com',
      password: 'SecurePass1!',
      role: 'customer',
      company: 'Zenith Labs Ltd'
    }
  ];

  for (const u of users) {
    const existing = await query('SELECT id FROM customers WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await query(
        'INSERT INTO customers (name, email, password_hash, role, company) VALUES ($1, $2, $3, $4, $5)',
        [u.name, u.email, hash, u.role, u.company]
      );
    }
  }

  // Seed sample active and draft subscriptions if none exist
  const existingSub = await query('SELECT id FROM subscriptions LIMIT 1');
  if (existingSub.rows.length === 0) {
    // Subscription 1: Active
    const subRes = await query(
      `INSERT INTO subscriptions (subscription_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'SUB-2026-0001',
        3, // Acme Corp
        1, // ERP Cloud Monthly
        'Active',
        '2026-01-01',
        '2027-01-01',
        '2026-04-01',
        'Net 30',
        'Acme Enterprise ERP setup with Odoo brand variant'
      ]
    );

    const subId = subRes.lastID || 1;
    await query(
      `INSERT INTO subscription_items (subscription_id, product_id, variant_id, variant_name, quantity, unit_price, tax_rate, amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [subId, 1, 1, 'Odoo (+560)', 2, 1560.00, 18.00, 3120.00]
    );

    // Initial Invoice for Subscription 1 (Paid)
    const invRes = await query(
      `INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, billing_period_start, billing_period_end, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        'INV-2026-0001',
        subId,
        3,
        'Paid',
        '2026-01-01',
        '2026-01-31',
        '2026-01-31',
        3120.00,
        561.60,
        0.00,
        3681.60,
        3681.60,
        0.00
      ]
    );

    const invId = invRes.lastID || 1;
    await query(
      `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, tax_rate, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [invId, 1, 'ERP Cloud Suite - Odoo Brand (Qty: 2)', 2, 1560.00, 18.00, 3681.60]
    );

    await query(
      `INSERT INTO payments (payment_number, invoice_id, amount, method, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['PAY-2026-0001', invId, 3681.60, 'bank_transfer', 'Wire transfer ref #WT-88910', 1]
    );

    // Sample Invoice 2: Confirmed / Outstanding
    const inv2Res = await query(
      `INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, billing_period_start, billing_period_end, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        'INV-2026-0002',
        subId,
        3,
        'Confirmed',
        '2026-02-01',
        '2026-02-28',
        '2026-02-28',
        3120.00,
        561.60,
        200.00,
        3481.60,
        0.00,
        3481.60
      ]
    );

    const inv2Id = inv2Res.lastID || 2;
    await query(
      `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, tax_rate, discount_applied, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [inv2Id, 1, 'ERP Cloud Suite - Odoo Brand (Qty: 2) [Less Discount $200]', 2, 1560.00, 18.00, 200.00, 3481.60]
    );
  }
}

// Unified query wrapper supporting $1, $2 or ?
function query(text, params = []) {
  if (isPostgres && pool) {
    return pool.query(text, params);
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      return reject(new Error('SQLite database not initialized yet.'));
    }

    // Convert PostgreSQL $1, $2... style parameters to ? for SQLite
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
  isPostgres: () => isPostgres
};
