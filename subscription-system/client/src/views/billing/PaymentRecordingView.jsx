import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../api/invoiceService';
import { reportingService } from '../../api/reportingService';
import { Modal } from '../../components/common/UIComponents';
import { CreditCard, Plus, CheckCircle2, DollarSign, Calendar, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentRecordingView = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    amount: '',
    method: 'bank_transfer',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, repRes] = await Promise.all([
        invoiceService.getInvoices(),
        reportingService.getDashboardMetrics()
      ]);
      if (invRes.success) {
        setInvoices(invRes.invoices);
        const unpaid = invRes.invoices.filter(i => i.status !== 'Paid');
        if (unpaid.length > 0 && !paymentForm.invoice_id) {
          setPaymentForm(prev => ({
            ...prev,
            invoice_id: unpaid[0].id,
            amount: unpaid[0].amount_due
          }));
        }
      }
      if (repRes.success && repRes.data.recent_payments) {
        setPayments(repRes.data.recent_payments);
      }
    } catch (err) {
      console.error('Error loading payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvoiceSelect = (id) => {
    const inv = invoices.find(i => i.id === parseInt(id));
    setPaymentForm(prev => ({
      ...prev,
      invoice_id: id,
      amount: inv ? inv.amount_due : ''
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await invoiceService.recordPayment(paymentForm.invoice_id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setIsRecordModalOpen(false);
        setPaymentForm({ invoice_id: '', amount: '', method: 'bank_transfer', notes: '' });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Payment Reconciliation & Recording</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Match incoming payments by wire transfer, credit card, or UPI against pending invoices
          </p>
        </div>
        <button onClick={() => setIsRecordModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Record Incoming Payment</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading payments data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Outstanding Invoices List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#6366f1" />
              <span>Pending Invoices Awaiting Payment</span>
            </h3>

            {invoices.filter(i => i.status !== 'Paid').length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                All customer invoices are fully settled!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem' }}>Invoice #</th>
                    <th style={{ padding: '0.75rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem' }}>Total Amount</th>
                    <th style={{ padding: '0.75rem' }}>Outstanding Due</th>
                    <th style={{ padding: '0.75rem' }}>Due Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.filter(i => i.status !== 'Paid').map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#fff' }}>{inv.invoice_number}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{inv.customer_name}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>${inv.total_amount.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>${inv.amount_due.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem', color: inv.is_overdue ? '#ef4444' : '#94a3b8' }}>
                        {inv.due_date} {inv.is_overdue ? '(OVERDUE)' : ''}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setPaymentForm({
                              invoice_id: inv.id,
                              amount: inv.amount_due,
                              method: 'bank_transfer',
                              notes: `Payment for ${inv.invoice_number}`
                            });
                            setIsRecordModalOpen(true);
                          }}
                          className="btn btn-success"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          Log Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Payment History */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>Recent Payment Audit Log</span>
            </h3>

            {payments.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No payments logged yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
                {payments.map((p) => (
                  <div key={p.id} style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '0.625rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>
                        {p.payment_number}
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#10b981' }}>+${p.amount.toFixed(2)}</strong>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                      For {p.invoice_number} • {p.customer_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>Method: {p.method?.replace('_', ' ')}</span>
                      <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Incoming Customer Payment"
      >
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Target Invoice
            </label>
            <select
              className="form-input"
              required
              value={paymentForm.invoice_id}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
            >
              {invoices.map(i => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} — {i.customer_name} (${i.amount_due} due)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Amount Settled ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="1560.00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Payment Method
              </label>
              <select
                className="form-input"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <option value="bank_transfer">Wire / Bank Transfer</option>
                <option value="credit_card">Credit Card (Stripe/Authorize)</option>
                <option value="upi">UPI / Instant Pay</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Transaction Reference / Notes
            </label>
            <textarea
              rows={2}
              className="form-input"
              placeholder="e.g. Wire reference #WT-99238 / bank statement matching notes"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Reconcile & Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
