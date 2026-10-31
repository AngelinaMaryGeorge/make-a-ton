const db = require('../config/db');
const SubscriptionModel = require('../models/subscription.model');
const InvoiceModel = require('../models/invoice.model');
const TaxCalculator = require('./taxCalculator');
const DiscountEngine = require('./discountEngine');

/**
 * Recurring Billing Scheduler Engine
 * Automatically generates invoices for due subscriptions without skips or duplicates
 */
const BillingScheduler = {
  /**
   * Run billing process for a specific target date (defaults to current date)
   */
  async runBillingCycle(targetDateStr = null) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const targetIso = targetDate.toISOString().split('T')[0];

    console.log(`[BillingScheduler] Running automated billing cycle for date: ${targetIso}`);

    // Query active subscriptions that are due for billing
    const res = await db.query(`
      SELECT s.*, 
             p.name as plan_name, p.billing_frequency, p.auto_close, p.allow_pause,
             c.name as customer_name, c.email as customer_email
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'Active'
        AND s.next_billing_date IS NOT NULL
        AND s.next_billing_date <= $1
    `, [targetIso]);

    const dueSubscriptions = res.rows;
    console.log(`[BillingScheduler] Found ${dueSubscriptions.length} subscriptions due for billing.`);

    const generatedInvoices = [];
    const skipped = [];
    const autoClosed = [];

    for (const sub of dueSubscriptions) {
      try {
        // Check if plan has auto_close and expiry_date reached
        if (sub.auto_close && sub.expiry_date && sub.expiry_date <= targetIso) {
          console.log(`[BillingScheduler] Auto-closing expired subscription #${sub.subscription_number}`);
          await SubscriptionModel.updateStatus(sub.id, 'Closed');
          autoClosed.push(sub.subscription_number);
          continue;
        }

        // Fetch subscription items
        const fullSub = await SubscriptionModel.findById(sub.id);
        if (!fullSub || !fullSub.items || fullSub.items.length === 0) {
          skipped.push({ subNumber: sub.subscription_number, reason: 'No subscription items found' });
          continue;
        }

        // Check for duplicate invoice in the current billing period
        const periodStart = sub.next_billing_date;
        const periodEnd = this.calculatePeriodEnd(periodStart, sub.billing_frequency);

        const existingInvoice = await db.query(`
          SELECT id FROM invoices 
          WHERE subscription_id = $1 
            AND billing_period_start = $2
            AND status != 'Cancelled'
        `, [sub.id, periodStart]);

        if (existingInvoice.rows.length > 0) {
          console.warn(`[BillingScheduler] Invoice already exists for ${sub.subscription_number} on ${periodStart}. Skipping.`);
          // Advance billing date to prevent stuck loop
          await SubscriptionModel.advanceBillingDate(sub.id, sub.next_billing_date, sub.billing_frequency);
          skipped.push({ subNumber: sub.subscription_number, reason: 'Duplicate prevention triggered' });
          continue;
        }

        // Calculate line items, taxes and discounts
        let subtotal = 0;
        let invoiceItems = [];

        for (const item of fullSub.items) {
          const lineSubtotal = item.quantity * item.unit_price;
          subtotal += lineSubtotal;

          invoiceItems.push({
            product_id: item.product_id,
            description: `${item.product_name || 'Software Subscription'} ${item.variant_name ? `(${item.variant_name})` : ''}`,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount_applied: 0,
            total_amount: lineSubtotal
          });
        }

        // Check automatic discount applicability
        let discountDeduction = 0;
        const autoDiscount = await DiscountEngine.findBestApplicableDiscount({
          totalAmount: subtotal,
          totalQuantity: fullSub.items.reduce((sum, it) => sum + it.quantity, 0),
          items: fullSub.items
        });

        if (autoDiscount && autoDiscount.eligible) {
          discountDeduction = autoDiscount.deduction;
          await DiscountEngine.recordDiscountUsage(autoDiscount.discountId);
        }

        // Calculate tax on discounted base
        const taxableBase = Math.max(0, subtotal - discountDeduction);
        const defaultTaxRate = await TaxCalculator.getDefaultTaxRate();
        const taxAmount = TaxCalculator.calculateTax(taxableBase, defaultTaxRate);
        const grandTotal = Math.round((taxableBase + taxAmount) * 100) / 100;

        // Due date: based on payment terms (Default 30 days or immediate)
        const dueDate = new Date(periodStart);
        dueDate.setDate(dueDate.getDate() + 30);
        const dueIso = dueDate.toISOString().split('T')[0];

        // Create invoice in 'Confirmed' status ready for billing
        const newInvoice = await InvoiceModel.create({
          subscription_id: sub.id,
          customer_id: sub.customer_id,
          status: 'Confirmed',
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          due_date: dueIso,
          subtotal: Math.round(subtotal * 100) / 100,
          tax_amount: taxAmount,
          discount_amount: discountDeduction,
          total_amount: grandTotal,
          items: invoiceItems
        });

        // Advance next billing date cleanly
        await SubscriptionModel.advanceBillingDate(sub.id, sub.next_billing_date, sub.billing_frequency);

        generatedInvoices.push(newInvoice);
        console.log(`[BillingScheduler] Generated invoice ${newInvoice.invoice_number} for subscription ${sub.subscription_number}`);
      } catch (err) {
        console.error(`[BillingScheduler] Error processing subscription ${sub.subscription_number}:`, err);
        skipped.push({ subNumber: sub.subscription_number, reason: err.message });
      }
    }

    return {
      success: true,
      cycleDate: targetIso,
      totalDue: dueSubscriptions.length,
      generatedCount: generatedInvoices.length,
      invoices: generatedInvoices,
      skipped,
      autoClosed
    };
  },

  calculatePeriodEnd(startDateStr, frequency) {
    const d = new Date(startDateStr);
    switch (frequency) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().split('T')[0];
  }
};

module.exports = BillingScheduler;
