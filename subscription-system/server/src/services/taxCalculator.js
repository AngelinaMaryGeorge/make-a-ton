const db = require('../config/db');

/**
 * Tax Calculator Service
 * Manages tax rules and calculates item and order tax totals
 */
const TaxCalculator = {
  /**
   * Retrieves active tax rate (or default rate of 18%)
   */
  async getDefaultTaxRate() {
    try {
      const res = await db.query('SELECT rate FROM tax_rules WHERE is_default = 1 LIMIT 1');
      if (res.rows.length > 0) {
        return parseFloat(res.rows[0].rate);
      }
    } catch (e) {
      console.warn('Error fetching tax rule:', e.message);
    }
    return parseFloat(process.env.TAX_DEFAULT_PERCENTAGE || 18.00);
  },

  /**
   * Calculate tax amount for a given taxable base
   */
  calculateTax(amount, rate = 18.00) {
    const base = parseFloat(amount) || 0;
    const taxRate = parseFloat(rate) || 0;
    const taxAmount = (base * taxRate) / 100.0;
    return Math.round(taxAmount * 100) / 100;
  },

  /**
   * Computes subtotal, tax, and total for an array of line items
   */
  async computeLineItemsTax(items) {
    const defaultRate = await this.getDefaultTaxRate();
    let subtotal = 0;
    let totalTax = 0;

    const computedItems = items.map(item => {
      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const itemSubtotal = qty * unitPrice;
      const rate = item.tax_rate !== undefined ? parseFloat(item.tax_rate) : defaultRate;
      const itemTax = this.calculateTax(itemSubtotal, rate);

      subtotal += itemSubtotal;
      totalTax += itemTax;

      return {
        ...item,
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: rate,
        tax_amount: itemTax,
        amount: Math.round((itemSubtotal + itemTax) * 100) / 100
      };
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(totalTax * 100) / 100,
      total_amount: Math.round((subtotal + totalTax) * 100) / 100,
      items: computedItems
    };
  }
};

module.exports = TaxCalculator;
