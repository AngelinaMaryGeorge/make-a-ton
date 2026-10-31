const SubscriptionModel = require('../models/subscription.model');
const InvoiceModel = require('../models/invoice.model');

/**
 * Recurring Billing Scheduler Engine
 * Automatically generates invoices for due subscriptions without skips or duplicates
 */
const BillingScheduler = {
  async runBillingCycle(targetDateStr = null) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const targetIso = targetDate.toISOString().split('T')[0];

    console.log(`[BillingScheduler] Running automated billing cycle for date: ${targetIso}`);

    // Query active subscriptions
    const allActive = await SubscriptionModel.getAll({ status: 'Active' });
    const dueSubscriptions = allActive.filter(s => !s.start_date || s.start_date <= targetIso);

    console.log(`[BillingScheduler] Found ${dueSubscriptions.length} subscriptions due for billing.`);

    const generatedInvoices = [];
    const skipped = [];
    const autoClosed = [];

    for (const sub of dueSubscriptions) {
      try {
        if (sub.auto_close && sub.expiry_date && sub.expiry_date <= targetIso) {
          console.log(`[BillingScheduler] Auto-closing expired subscription #${sub.subscription_number}`);
          await SubscriptionModel.updateStatus(sub.id, 'Closed');
          autoClosed.push(sub.subscription_number);
          continue;
        }

        // Duplicate prevention check:
        // Ensure no invoice has already been created for this subscription today / during this cycle
        const existingInvoices = await InvoiceModel.getAll({ subscription_id: sub.id });
        const alreadyBilled = existingInvoices.some(inv => {
          if (!inv.created_at) return false;
          const invDate = new Date(inv.created_at).toISOString().split('T')[0];
          return invDate === targetIso && inv.status !== 'Cancelled';
        });

        if (alreadyBilled) {
          console.log(`[BillingScheduler] Subscription ${sub.subscription_number} already billed for date ${targetIso}. Skipping.`);
          skipped.push({ subNumber: sub.subscription_number, reason: 'Already billed for period' });
          continue;
        }

        const subtotal = sub.total_amount || 1000.00;
        const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
        const grandTotal = subtotal + taxAmount;

        const dueDate = new Date(targetDate);
        dueDate.setDate(dueDate.getDate() + 30);
        const dueIso = dueDate.toISOString().split('T')[0];

        const newInvoice = await InvoiceModel.create({
          subscription_id: sub.id,
          customer_id: sub.customer_id,
          status: 'Confirmed',
          subtotal,
          tax_amount: taxAmount,
          total_amount: grandTotal,
          due_date: dueIso
        });

        await SubscriptionModel.advanceBillingDate(sub.id, sub.start_date, sub.billing_frequency);

        generatedInvoices.push(newInvoice);
        console.log(`[BillingScheduler] Generated invoice for subscription ${sub.subscription_number}`);
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
  }
};

module.exports = BillingScheduler;
