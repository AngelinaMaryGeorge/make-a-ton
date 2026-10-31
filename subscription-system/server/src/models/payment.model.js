const db = require('../config/db');
const InvoiceModel = require('./invoice.model');

const PaymentModel = {
  async getAll() {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('payments')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw new Error(error.message);

      return (data || []).map(p => ({
        ...p,
        payment_number: `PAY-${String(p.id).padStart(4, '0')}`,
        invoice_number: `INV-${String(p.invoice_id).padStart(4, '0')}`,
        customer_name: 'Customer',
        amount: parseFloat(p.amount)
      }));
    }

    const res = await db.query(`
      SELECT p.*, i.id as invoice_num, c.email as customer_email
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON i.customer_id = c.id
      ORDER BY p.id DESC
    `);

    return res.rows.map(p => ({
      ...p,
      payment_number: `PAY-${String(p.id).padStart(4, '0')}`,
      invoice_number: `INV-${String(p.invoice_id).padStart(4, '0')}`,
      customer_name: p.customer_email.split('@')[0],
      amount: parseFloat(p.amount)
    }));
  },

  async recordPayment({ invoice_id, amount, method = 'bank_transfer', notes = '' }) {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('payments')
        .insert([{
          invoice_id: parseInt(invoice_id),
          amount: paymentAmount,
          method,
          notes
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Update invoice status to Paid
      await InvoiceModel.updateStatus(invoice_id, 'Paid');

      return {
        ...data,
        payment_number: `PAY-${String(data.id).padStart(4, '0')}`,
        amount: paymentAmount
      };
    }

    const res = await db.query(`
      INSERT INTO payments (invoice_id, amount, method, notes)
      VALUES ($1, $2, $3, $4)
    `, [invoice_id, paymentAmount, method, notes]);

    await InvoiceModel.updateStatus(invoice_id, 'Paid');

    return {
      id: res.lastID,
      payment_number: `PAY-${String(res.lastID).padStart(4, '0')}`,
      invoice_id,
      amount: paymentAmount,
      method,
      notes
    };
  }
};

module.exports = PaymentModel;
