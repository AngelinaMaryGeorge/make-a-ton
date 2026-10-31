import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../api/invoiceService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { Receipt, Play, Printer, Send, Filter, CheckCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const InvoiceListView = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getInvoices({
        status: statusFilter || undefined,
        overdue: overdueOnly ? 'true' : undefined
      });
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, overdueOnly]);

  const handleRunBillingDay = async () => {
    try {
      setRunningBilling(true);
      const res = await invoiceService.runBillingCycle();
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        alert(`Billing Day Execution Complete: Generated ${res.details.generatedCount} invoices.`);
        loadInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing billing day cycle');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const res = await invoiceService.updateStatus(invoiceId, newStatus);
      if (res.success) {
        loadInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating invoice status');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      const res = await invoiceService.sendInvoice(invoiceId);
      if (res.success) {
        alert(res.message);
      }
    } catch (err) {
      alert('Error sending invoice email');
    }
  };

  const handlePrint = (inv) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Header with Automated Billing Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Invoice Pipeline & Recurring Billing</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Pipeline tracking (Draft → Confirmed → Paid), automated tax calculation, and billing day execution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleRunBillingDay}
            disabled={runningBilling}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Play size={16} fill="white" />
            <span>{runningBilling ? 'Executing Billing...' : 'Run Billing Day Now'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8' }}>Filter Pipeline:</span>
          {['', 'Draft', 'Confirmed', 'Paid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              {st === '' ? 'All Invoices' : st}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#f87171', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          <span>Show Overdue Invoices Only</span>
        </label>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading invoice pipeline...</div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Receipt size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No invoices matching filter</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {invoices.map((inv) => (
            <div key={inv.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    {inv.invoice_number}
                  </span>
                  <StatusBadge status={inv.status} />
                  {inv.is_overdue && (
                    <span className="badge badge-closed" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={12} /> Overdue
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                  Customer: <strong style={{ color: '#fff' }}>{inv.customer_name}</strong> {inv.customer_company ? `(${inv.customer_company})` : ''} • Due: {inv.due_date}
                </div>

                {inv.subscription_number && (
                  <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.2rem' }}>
                    Subscription Ref: #{inv.subscription_number}
                  </div>
                )}
              </div>

              {/* Amounts Breakdown */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  ${inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: inv.amount_due > 0 ? '#fbbf24' : '#10b981', fontWeight: 600 }}>
                  {inv.amount_due > 0 ? `Unpaid Balance: $${inv.amount_due.toFixed(2)}` : 'Fully Paid'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {inv.status === 'Draft' && (
                  <button
                    onClick={() => handleUpdateStatus(inv.id, 'Confirmed')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                  >
                    Confirm Invoice
                  </button>
                )}

                <button
                  onClick={() => handleSendInvoice(inv.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                  title="Send via Email"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>

                <button
                  onClick={() => handlePrint(inv)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                  title="Print / PDF Invoice"
                >
                  <Printer size={14} />
                  <span>Print View</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Tax Invoice (Print View)"
        maxWidth="750px"
      >
        {selectedInvoice && (
          <div className="printable-invoice" style={{ padding: '1rem', backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: '#4f46e5', fontWeight: 800, fontSize: '1.5rem' }}>BRIGHTLOOP SOFTWARE</h2>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Cloud ERP & Subscription Services</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Tax ID: GSTIN99238491823</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedInvoice.invoice_number}</h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 600 }}>Due Date: {selectedInvoice.due_date}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <strong style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Billed To:</strong>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{selectedInvoice.customer_name}</div>
                {selectedInvoice.customer_company && <div>{selectedInvoice.customer_company}</div>}
                <div>{selectedInvoice.customer_email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Invoice Status:</strong>
                <div style={{ marginTop: '0.2rem', fontWeight: 700, color: selectedInvoice.status === 'Paid' ? '#16a34a' : '#d97706' }}>
                  {selectedInvoice.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '0.6rem' }}>Description</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Tax (18%)</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items && selectedInvoice.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem' }}>{item.description}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>${item.unit_price.toFixed(2)}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{item.tax_rate}%</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>${item.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <div style={{ width: '240px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#16a34a' }}>
                    <span>Discounts:</span>
                    <span>-${selectedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Taxes (GST 18%):</span>
                  <span>${selectedInvoice.tax_amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.4rem' }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#4f46e5' }}>${selectedInvoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }} className="no-print">
              <button className="btn btn-secondary" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Document
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
