-- =====================================================================
-- Master SQL Script: 001_initial_schema.sql
-- Brightloop Subscription Management System
-- Compatible with PostgreSQL & SQLite
-- =====================================================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer', -- 'admin', 'staff', 'customer'
    company VARCHAR(255),
    phone VARCHAR(50),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'software', -- software, service, add-on
    sales_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) DEFAULT 0.00,
    variant_metadata TEXT, -- JSON string of available attributes
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL, -- e.g. 'brand', 'tier'
    attribute_value VARCHAR(100) NOT NULL, -- e.g. 'Odoo', 'Enterprise'
    price_modifier DECIMAL(12,2) DEFAULT 0.00, -- e.g. +560.00
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    billing_frequency VARCHAR(20) NOT NULL CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    price DECIMAL(12,2) NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    auto_close BOOLEAN DEFAULT 0,
    allow_pause BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
    valid_days INTEGER DEFAULT 30,
    description TEXT,
    default_lines TEXT, -- JSON string of default products/variants/qty
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    template_id INTEGER REFERENCES quotation_templates(id),
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Converted, Expired
    valid_until DATE,
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER REFERENCES product_variants(id),
    variant_name VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    amount DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    quote_id INTEGER REFERENCES quotes(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed')),
    start_date DATE NOT NULL,
    expiry_date DATE,
    next_billing_date DATE,
    last_billing_date DATE,
    payment_terms VARCHAR(100) DEFAULT 'Immediate',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    variant_id INTEGER REFERENCES product_variants(id),
    variant_name VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    amount DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fixed', 'percentage')),
    amount DECIMAL(12,2) NOT NULL,
    min_purchase DECIMAL(12,2) DEFAULT 0.00,
    min_quantity INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    applicable_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Confirmed', 'Paid', 'Cancelled')),
    billing_period_start DATE,
    billing_period_end DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    amount_due DECIMAL(12,2) NOT NULL,
    pdf_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    discount_applied DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50) NOT NULL, -- 'credit_card', 'bank_transfer', 'upi', 'cash', 'cheque'
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    recorded_by INTEGER REFERENCES customers(id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
