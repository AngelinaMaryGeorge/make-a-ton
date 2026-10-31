const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { initDb } = require('../src/config/db');
const DiscountModel = require('../src/models/discount.model');
const DiscountEngine = require('../src/services/discountEngine');

describe('Discount Engine Integration Tests', () => {
  before(async () => {
    await initDb();
  });

  it('should apply percentage discount when requirements are satisfied', async () => {
    // GROWTH15: 15% discount with min_purchase 2000, min_quantity 5
    const evaluation = await DiscountEngine.evaluateDiscount('GROWTH15', {
      totalAmount: 3000,
      totalQuantity: 6,
      items: [{ product_id: 1, quantity: 6, unit_price: 500 }]
    });

    assert.strictEqual(evaluation.eligible, true, 'Discount should be eligible');
    assert.strictEqual(evaluation.deduction, 450, '15% of 3000 should be 450 deduction');
    assert.strictEqual(evaluation.finalAmount, 2550, 'Final amount should be 2550');
  });

  it('should reject discount when minimum quantity is not met', async () => {
    const evaluation = await DiscountEngine.evaluateDiscount('GROWTH15', {
      totalAmount: 3000,
      totalQuantity: 2, // Less than 5 required
      items: [{ product_id: 1, quantity: 2, unit_price: 1500 }]
    });

    assert.strictEqual(evaluation.eligible, false, 'Should be ineligible due to low quantity');
    assert.ok(evaluation.reason.includes('Minimum quantity'), 'Reason should mention minimum quantity');
  });

  it('should respect discount usage limit and auto-deactivate when exhausted', async () => {
    // Create a discount with usage limit of 2
    const testCode = `TESTLIM-${Date.now()}`;
    const disc = await DiscountModel.create({
      code: testCode,
      name: 'Limited Use Test',
      type: 'fixed',
      amount: 50,
      usage_limit: 2,
      min_purchase: 100
    });

    // Use 1
    await DiscountModel.incrementUsage(disc.id);
    let check1 = await DiscountModel.findById(disc.id);
    assert.strictEqual(check1.used_count, 1);
    assert.strictEqual(check1.is_active, true);

    // Use 2 (reaches limit)
    await DiscountModel.incrementUsage(disc.id);
    let check2 = await DiscountModel.findById(disc.id);
    assert.strictEqual(check2.used_count, 2);
    assert.strictEqual(check2.is_active, false, 'Should be deactivated once limit is reached');

    // Next evaluation should fail
    const evalResult = await DiscountEngine.evaluateDiscount(disc.id, {
      totalAmount: 200,
      totalQuantity: 1
    });
    assert.strictEqual(evalResult.eligible, false, 'Exhausted discount cannot be applied');
  });
});
