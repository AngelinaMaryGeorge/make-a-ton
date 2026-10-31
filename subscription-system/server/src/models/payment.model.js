const db = require('../config/db');

const PaymentModel = {
  async getAll() {
    const res = await db.query(`
      SELECT p.*, 
             i.invoice_number, i.total_amount as invoice_total, i.amount_due as invoice_amount_due,
             c.name as customer_name, c.email as customer_email,
             staff.name as recorded_by_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN customers staff ON p.recorded_by = staff.id
      ORDER BY p.payment_date DESC
    `);
    return res.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
  },

  async findById(id) {
    const res = await db.query(`
      SELECT p.*, i.invoice_number, c.name as customer_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE p.id = $1
    `, [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      amount: parseFloat(r.amount)
    };
  },

  async recordPayment({ invoice_id, amount, method = 'bank_transfer', notes = '', recorded_by = null }) {
    const invRes = await db.query('SELECT * FROM invoices WHERE id = $1', [invoice_id]);
    if (invRes.rows.length === 0) {
      throw new Error('Invoice not found');
    }
    const inv = invRes.rows[0];
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const countRes = await db.query('SELECT COUNT(*) as count FROM payments');
    const seq = parseInt(countRes.rows[0]?.count || 0) + 1;
    const payment_number = `PAY-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

    const res = await db.query(`
      INSERT INTO payments (payment_number, invoice_id, amount, method, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [payment_number, invoice_id, paymentAmount, method, notes, recorded_by]);

    // Recalculate invoice amounts
    const currentPaid = parseFloat(inv.amount_paid || 0);
    const newPaid = currentPaid + paymentAmount;
    const totalAmount = parseFloat(inv.total_amount);
    const newDue = Math.max(0, totalAmount - newPaid);
    const newStatus = newDue <= 0.001 ? 'Paid' : 'Confirmed';

    await db.query(`
      UPDATE invoices
      SET amount_paid = $1, amount_due = $2, status = $3
      WHERE id = $4
    `, [newPaid, newDue, newStatus, invoice_id]);

    return this.findById(res.lastID);
  }
};

module.exports = PaymentModel;
