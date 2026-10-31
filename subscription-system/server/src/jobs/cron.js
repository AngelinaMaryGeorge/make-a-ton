const cron = require('node-cron');
const BillingScheduler = require('../services/billingScheduler');

let scheduledTask = null;

/**
 * Initializes background cron job for automated billing
 */
function initBillingCron() {
  const schedule = process.env.BILLING_CRON_SCHEDULE || '0 0 * * *'; // Default midnight every day
  const isEnabled = process.env.AUTO_INVOICE_GENERATION !== 'false';

  if (!isEnabled) {
    console.log('[Cron] Automated billing cron is disabled via config.');
    return;
  }

  console.log(`[Cron] Initializing automated recurring billing scheduler with cron pattern: "${schedule}"`);

  scheduledTask = cron.schedule(schedule, async () => {
    console.log('[Cron] Automated billing trigger started.');
    try {
      const result = await BillingScheduler.runBillingCycle();
      console.log(`[Cron] Billing cycle completed successfully: generated ${result.generatedCount} invoices.`);
    } catch (err) {
      console.error('[Cron] Error during scheduled billing run:', err);
    }
  });
}

function stopBillingCron() {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log('[Cron] Billing cron stopped.');
  }
}

module.exports = {
  initBillingCron,
  stopBillingCron
};
