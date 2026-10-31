-- =====================================================================
-- Initial Seed Dataset: initial_seed.sql
-- Brightloop Software Subscription System
-- Password for all seed users is: SecurePass1! (hash generated via bcrypt 10 rounds)
-- Hash: $2a$10$wT0Xk3E64tV90.QpU3o9iOpz3WJ0pLqXpG3B0GzE1M8U/gJ4q4E8m or generated on init
-- =====================================================================

-- Default Tax Rules
INSERT OR IGNORE INTO tax_rules (id, name, rate, is_default) VALUES 
(1, 'Standard GST (18%)', 18.00, 1),
(2, 'Reduced Tax (5%)', 5.00, 0),
(3, 'Zero Rated (0%)', 0.00, 0);

-- Products
INSERT OR IGNORE INTO products (id, name, type, sales_price, cost_price, variant_metadata, notes) VALUES 
(1, 'ERP Cloud Suite', 'software', 1000.00, 200.00, '{"brand":["Standard","Odoo","SAP"]}', 'Flagship cloud enterprise resource planning suite'),
(2, 'Analytics AI Pro', 'add-on', 350.00, 50.00, '{"tier":["Basic","Pro"]}', 'Advanced business intelligence and predictive insights engine'),
(3, 'Dedicated 24/7 Support', 'service', 250.00, 80.00, '{"level":["Standard","VIP"]}', 'Priority SLA hotline and assigned technical account manager'),
(4, 'Automated Billing Relay', 'software', 500.00, 100.00, '{"edition":["Community","Enterprise"]}', 'Multi-gateway recurring payment reconciliation tool');

-- Product Variants (Notice Odoo brand adds +560.00)
INSERT OR IGNORE INTO product_variants (id, product_id, attribute_name, attribute_value, price_modifier) VALUES 
(1, 1, 'brand', 'Odoo', 560.00),
(2, 1, 'brand', 'Standard', 0.00),
(3, 1, 'brand', 'Enterprise Plus', 850.00),
(4, 2, 'tier', 'Pro', 150.00);

-- Plans
INSERT OR IGNORE INTO plans (id, product_id, name, billing_frequency, price, min_quantity, start_date, end_date, auto_close, allow_pause) VALUES 
(1, 1, 'ERP Cloud Monthly (Standard)', 'monthly', 1000.00, 1, '2026-01-01', '2027-12-31', 0, 1),
(2, 1, 'ERP Cloud Yearly (Discounted)', 'yearly', 10800.00, 1, '2026-01-01', '2027-12-31', 0, 1),
(3, 2, 'Analytics AI Monthly Add-on', 'monthly', 350.00, 1, '2026-01-01', '2027-12-31', 0, 1),
(4, 1, 'ERP Daily Trial Sprint', 'daily', 50.00, 1, '2026-01-01', '2026-12-31', 1, 0),
(5, 4, 'Billing Relay Weekly Sync', 'weekly', 125.00, 1, '2026-01-01', '2027-12-31', 0, 1);

-- Quotation Templates
INSERT OR IGNORE INTO quotation_templates (id, name, plan_id, valid_days, description, default_lines) VALUES 
(1, 'Enterprise Odoo Package', 1, 15, 'Full ERP Cloud with Odoo Brand (+560) plus 24/7 dedicated support', 
'[{"product_id":1,"variant_id":1,"variant_name":"Odoo (+560)","quantity":5,"unit_price":1560.00,"tax_rate":18.00},{"product_id":3,"variant_id":null,"variant_name":null,"quantity":1,"unit_price":250.00,"tax_rate":18.00}]'),
(2, 'SMB Starter Monthly', 1, 30, 'Single seat standard ERP Cloud Monthly', 
'[{"product_id":1,"variant_id":2,"variant_name":"Standard","quantity":1,"unit_price":1000.00,"tax_rate":18.00}]');

-- Discounts
INSERT OR IGNORE INTO discounts (id, code, name, type, amount, min_purchase, min_quantity, usage_limit, used_count, start_date, end_date, applicable_product_id, is_active) VALUES 
(1, 'GROWTH15', '15% Volume Seat Discount', 'percentage', 15.00, 2000.00, 5, 100, 3, '2026-01-01', '2026-12-31', NULL, 1),
(2, 'WELCOME200', 'Flat $200 First Plan Credit', 'fixed', 200.00, 1000.00, 1, 50, 12, '2026-01-01', '2026-12-31', NULL, 1),
(3, 'ODOOSAVE10', '10% Odoo Brand Special', 'percentage', 10.00, 1500.00, 1, 200, 4, '2026-01-01', '2026-12-31', 1, 1);
