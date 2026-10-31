const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDb } = require('../src/config/db');
const BillingScheduler = require('../src/services/billingScheduler');
const SubscriptionModel = require('../src/models/subscription.model');
const InvoiceModel = require('../src/models/invoice.model');

describe('Recurring Billing Engine Integration Tests', () => {
  before(async () => {
    await initDb();
  });

  it('should successfully run billing cycle and not skip or duplicate invoices', async () => {
    // Create a dedicated active test subscription due today
    const today = new Date().toISOString().split('T')[0];
    const sub = await SubscriptionModel.create({
      customer_id: 3, // Acme Corp
      plan_id: 1, // Monthly ERP
      status: 'Active',
      start_date: today,
      payment_terms: 'Net 30',
      items: [
        {
          product_id: 1,
          quantity: 2,
          unit_price: 1000.00,
          tax_rate: 18.00
        }
      ]
    });

    assert.ok(sub.id, 'Subscription should be created');
    assert.strictEqual(sub.status, 'Active');

    // Run first billing cycle
    const result1 = await BillingScheduler.runBillingCycle(today);
    assert.ok(result1.success, 'Billing cycle should execute successfully');
    
    // Check invoice was generated for this subscription
    const invoices = await InvoiceModel.getAll({ subscription_id: sub.id });
    assert.ok(invoices.length >= 1, 'At least one invoice should have been generated');

    const firstInvoice = invoices[0];
    assert.strictEqual(firstInvoice.status, 'Confirmed', 'Generated invoice should start in Confirmed status');
    assert.ok(firstInvoice.total_amount > 0, 'Invoice total amount should be calculated');

    // Run second billing cycle on the SAME date to verify duplicate prevention
    const result2 = await BillingScheduler.runBillingCycle(today);
    const invoicesAfter = await InvoiceModel.getAll({ subscription_id: sub.id });
    
    // The number of invoices for this subscription must NOT increase on the same billing period
    assert.strictEqual(invoicesAfter.length, invoices.length, 'Idempotency check: should NOT duplicate invoice for the same period');
  });

  it('should advance next_billing_date according to frequency', async () => {
    const today = '2026-05-01';
    const sub = await SubscriptionModel.create({
      customer_id: 3,
      plan_id: 1, // Monthly
      status: 'Active',
      start_date: today,
      items: [{ product_id: 1, quantity: 1, unit_price: 1000.00 }]
    });

    await BillingScheduler.runBillingCycle(today);
    const updated = await SubscriptionModel.findById(sub.id);
    
    assert.notStrictEqual(updated.next_billing_date, today, 'next_billing_date should advance');
  });
});
