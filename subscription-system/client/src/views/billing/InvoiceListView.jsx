import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../api/invoiceService';
import { StatusBadge, Modal, LoadingBlock, EmptyState } from '../../components/common/UIComponents';
import { Receipt, Play, Printer, Send, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
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
      if (res.success) setInvoices(res.invoices);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, [statusFilter, overdueOnly]);

  const handleRunBillingDay = async () => {
    try {
      setRunningBilling(true);
      const res = await invoiceService.runBillingCycle();
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        alert(`Billing Day Complete: Generated ${res.details.generatedCount} invoices.`);
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
      if (res.success) loadInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating invoice status');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      const res = await invoiceService.sendInvoice(invoiceId);
      if (res.success) alert(res.message);
    } catch (err) {
      alert('Error sending invoice email');
    }
  };

  const FILTERS = ['', 'Draft', 'Confirmed', 'Paid'];

  return (
    <div style={{ padding: '0 1rem 2rem 0.25rem' }}>

      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Invoice Pipeline</h1>
          <p className="page-subtitle">
            Draft → Confirmed → Paid · automated tax calculation · billing day execution
          </p>
        </div>
        <button
          onClick={handleRunBillingDay}
          disabled={runningBilling}
          className="btn btn-success"
        >
          {runningBilling
            ? <><div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#fff' }} /><span>Running...</span></>
            : <><Play size={15} fill="white" /><span>Run Billing Day</span></>
          }
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel animate-fade-in-up" style={{ padding: '0.75rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FILTERS.map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '4px',
            border: `2px solid ${overdueOnly ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            background: overdueOnly ? 'rgba(239,68,68,0.2)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s'
          }} onClick={() => setOverdueOnly(!overdueOnly)}>
            {overdueOnly && <CheckCircle size={10} color="#ef4444" />}
          </div>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={e => setOverdueOnly(e.target.checked)}
            style={{ display: 'none' }}
          />
          <span style={{ color: overdueOnly ? '#f87171' : '#94a3b8' }}>Overdue Only</span>
        </label>
      </div>

      {/* Invoices List */}
      {loading ? (
        <LoadingBlock message="Loading invoice pipeline..." />
      ) : invoices.length === 0 ? (
        <div className="glass-panel">
          <EmptyState icon={Receipt} title="No invoices match this filter" description="Try changing the filter or run the billing cycle." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {invoices.map((inv, idx) => (
            <div
              key={inv.id}
              className="glass-panel animate-fade-in-up"
              style={{
                padding: '1.1rem 1.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                animationDelay: `${idx * 0.04}s`,
                borderLeft: inv.is_overdue ? '3px solid rgba(239,68,68,0.55)' : '3px solid transparent'
              }}
            >
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 800, color: '#fff' }}>
                    {inv.invoice_number}
                  </span>
                  <StatusBadge status={inv.status} />
                  {inv.is_overdue && (
                    <span className="badge badge-closed">
                      <AlertTriangle size={10} /> Overdue
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  <strong style={{ color: '#e2e8f0' }}>{inv.customer_name}</strong>
                  {inv.customer_company ? ` (${inv.customer_company})` : ''}
                  {' · '}Due: <span style={{ color: inv.is_overdue ? '#f87171' : '#cbd5e1' }}>{inv.due_date}</span>
                </div>
                {inv.subscription_number && (
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.15rem' }}>
                    Sub #{inv.subscription_number}
                  </div>
                )}
              </div>

              {/* Amounts */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                  ${inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: inv.amount_due > 0 ? '#fbbf24' : '#34d399' }}>
                  {inv.amount_due > 0 ? `Unpaid: $${inv.amount_due.toFixed(2)}` : '✓ Fully Paid'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                {inv.status === 'Draft' && (
                  <button onClick={() => handleUpdateStatus(inv.id, 'Confirmed')} className="btn btn-secondary btn-sm">
                    Confirm
                  </button>
                )}
                <button onClick={() => handleSendInvoice(inv.id)} className="btn btn-secondary btn-sm" title="Send via email">
                  <Send size={13} /><span>Send</span>
                </button>
                <button onClick={() => { setSelectedInvoice(inv); setIsPrintModalOpen(true); }} className="btn btn-secondary btn-sm" title="Print / PDF">
                  <Printer size={13} /><span>Print</span>
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
        title="Tax Invoice — Print View"
        maxWidth="760px"
      >
        {selectedInvoice && (
          <div className="printable-invoice" style={{ padding: '1rem', backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: '#4f46e5', fontWeight: 800, fontSize: '1.5rem' }}>BRIGHTLOOP SOFTWARE</h2>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Cloud ERP &amp; Subscription Services</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Tax ID: GSTIN99238491823</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedInvoice.invoice_number}</h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 600 }}>Due: {selectedInvoice.due_date}</div>
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
                <strong style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status:</strong>
                <div style={{ marginTop: '0.2rem', fontWeight: 700, color: selectedInvoice.status === 'Paid' ? '#16a34a' : '#d97706' }}>
                  {selectedInvoice.status?.toUpperCase()}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '0.6rem' }}>Description</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Tax</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, i) => (
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <div style={{ width: '260px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span>${selectedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#16a34a' }}>
                    <span>Discounts:</span>
                    <span>-${selectedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#64748b' }}>GST (18%):</span>
                  <span>${selectedInvoice.tax_amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem', borderTop: '1px solid #cbd5e1', paddingTop: '0.4rem' }}>
                  <span>Total Due:</span>
                  <span style={{ color: '#4f46e5' }}>${selectedInvoice.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsPrintModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Document
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
