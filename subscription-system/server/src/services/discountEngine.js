const db = require('../config/db');
const DiscountModel = require('../models/discount.model');

/**
 * Discount Engine Service
 * Validates discount eligibility and calculates line-item / order deductions
 */
const DiscountEngine = {
  /**
   * Evaluates if a discount rule can be applied to an order / subscription lines
   */
  async evaluateDiscount(discountIdOrCode, { totalAmount, totalQuantity = 0, items = [] }) {
    let discount = null;
    if (typeof discountIdOrCode === 'number' || !isNaN(parseInt(discountIdOrCode))) {
      discount = await DiscountModel.findById(parseInt(discountIdOrCode));
    } else {
      discount = await DiscountModel.findByCode(discountIdOrCode);
    }

    if (!discount) {
      return { eligible: false, reason: 'Discount rule not found', deduction: 0 };
    }

    if (!discount.is_active) {
      return { eligible: false, reason: 'Discount rule is inactive', deduction: 0 };
    }

    // Check usage limits
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return { eligible: false, reason: 'Discount rule usage limit has been exceeded', deduction: 0 };
    }

    // Check validity dates
    const today = new Date().toISOString().split('T')[0];
    if (discount.start_date && today < discount.start_date) {
      return { eligible: false, reason: 'Discount is not yet valid', deduction: 0 };
    }
    if (discount.end_date && today > discount.end_date) {
      return { eligible: false, reason: 'Discount has expired', deduction: 0 };
    }

    // Check minimum purchase amount
    const parsedTotal = parseFloat(totalAmount) || 0;
    if (discount.min_purchase && parsedTotal < discount.min_purchase) {
      return { eligible: false, reason: `Minimum purchase of $${discount.min_purchase} required`, deduction: 0 };
    }

    // Check minimum quantity
    const parsedQty = parseInt(totalQuantity) || items.reduce((acc, it) => acc + (parseInt(it.quantity) || 1), 0);
    if (discount.min_quantity && parsedQty < discount.min_quantity) {
      return { eligible: false, reason: `Minimum quantity of ${discount.min_quantity} items required`, deduction: 0 };
    }

    // Calculate deduction amount
    let deduction = 0;
    if (discount.applicable_product_id) {
      // Applies to specific product items only
      const eligibleItems = items.filter(it => it.product_id === discount.applicable_product_id);
      const eligibleBase = eligibleItems.reduce((acc, it) => acc + ((it.quantity || 1) * (it.unit_price || 0)), 0);

      if (discount.type === 'percentage') {
        deduction = (eligibleBase * discount.amount) / 100.0;
      } else {
        deduction = Math.min(discount.amount, eligibleBase);
      }
    } else {
      // Applies to whole order/subscription
      if (discount.type === 'percentage') {
        deduction = (parsedTotal * discount.amount) / 100.0;
      } else {
        deduction = Math.min(discount.amount, parsedTotal);
      }
    }

    deduction = Math.round(deduction * 100) / 100;

    return {
      eligible: true,
      discount,
      deduction,
      finalAmount: Math.max(0, Math.round((parsedTotal - deduction) * 100) / 100)
    };
  },

  /**
   * Applies the discount by incrementing the usage count
   */
  async recordDiscountUsage(discountId) {
    await DiscountModel.incrementUsage(discountId);
  },

  /**
   * Automatically looks for applicable active discounts for an order
   */
  async findBestApplicableDiscount({ totalAmount, totalQuantity, items }) {
    const allDiscounts = await DiscountModel.getAll();
    let bestDiscount = null;
    let maxDeduction = 0;

    for (const d of allDiscounts) {
      const evalResult = await this.evaluateDiscount(d.id, { totalAmount, totalQuantity, items });
      if (evalResult.eligible && evalResult.deduction > maxDeduction) {
        maxDeduction = evalResult.deduction;
        bestDiscount = { ...evalResult, discountId: d.id };
      }
    }

    return bestDiscount;
  }
};

module.exports = DiscountEngine;
