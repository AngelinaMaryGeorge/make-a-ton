import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../api/invoiceService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { FileCheck, Printer, Download, AlertTriangle } from 'lucide-react';

export const MyInvoicesView = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const res = await invoiceService.getMyInvoices();
        if (res.success) {
          setInvoices(res.invoices);
        }
      } catch (err) {
        console.error('Error loading my invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  const handlePrint = (inv) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Invoices & Receipts</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Access your recurring billing statements, view tax breakdowns, and download official receipts
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileCheck size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No invoices issued yet</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {invoices.map((inv) => (
            <div key={inv.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    {inv.invoice_number}
                  </span>
                  <StatusBadge status={inv.status} />
                  {inv.is_overdue && (
                    <span className="badge badge-closed">Overdue</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  Billing Date: {new Date(inv.created_at).toLocaleDateString()} • Due by: <strong style={{ color: '#cbd5e1' }}>{inv.due_date}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                  ${inv.total_amount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: inv.status === 'Paid' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                  {inv.status === 'Paid' ? 'Paid in Full' : `Balance Due: $${inv.amount_due.toFixed(2)}`}
                </div>
              </div>

              <div>
                <button
                  onClick={() => handlePrint(inv)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
                >
                  <Printer size={14} />
                  <span>Download / Print Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Tax Invoice & Receipt"
        maxWidth="700px"
      >
        {selectedInvoice && (
          <div className="printable-invoice" style={{ padding: '1.25rem', backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ color: '#4f46e5', fontWeight: 800 }}>BRIGHTLOOP SOFTWARE</h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cloud Recurring Subscriptions</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{selectedInvoice.invoice_number}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Due: {selectedInvoice.due_date}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <strong style={{ color: '#64748b', fontSize: '0.75rem' }}>CUSTOMER:</strong>
              <div>{selectedInvoice.customer_name} ({selectedInvoice.customer_email})</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '0.5rem' }}>Item</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items && selectedInvoice.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem' }}>{it.description}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>${it.unit_price.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>${it.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <div style={{ width: '220px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Tax (GST 18%):</span>
                  <span>${selectedInvoice.tax_amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.35rem' }}>
                  <span>Total Paid:</span>
                  <span style={{ color: '#16a34a' }}>${selectedInvoice.amount_paid.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }} className="no-print">
              <button className="btn btn-secondary" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
