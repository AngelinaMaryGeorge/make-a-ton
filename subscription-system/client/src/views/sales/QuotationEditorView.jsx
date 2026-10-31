import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { productService } from '../../api/productService';
import { authService } from '../../api/authService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { FileEdit, Plus, CheckCircle, ArrowRight, Sparkles, Trash2, Zap, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuotationEditorView = ({ onViewChange }) => {
  const [quotes, setQuotes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  // New quote draft state
  const [quoteDraft, setQuoteDraft] = useState({
    customer_id: '',
    template_id: '',
    plan_id: 1,
    valid_days: 15,
    payment_terms: 'Net 30',
    notes: '',
    items: [
      { product_id: 1, variant_id: 1, variant_name: 'Odoo (+560)', quantity: 2, unit_price: 1560.00, tax_rate: 18.00 }
    ]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qRes, tRes, plRes, prRes, cRes] = await Promise.all([
        subscriptionService.getQuotes(),
        subscriptionService.getQuoteTemplates(),
        productService.getPlans(),
        productService.getProducts(),
        authService.getClients()
      ]);
      if (qRes.success) setQuotes(qRes.quotes);
      if (tRes.success) setTemplates(tRes.templates);
      if (plRes.success) setPlans(plRes.plans);
      if (prRes.success) setProducts(prRes.products);
      if (cRes.success && cRes.clients) {
        setClients(cRes.clients);
        if (cRes.clients.length > 0 && !quoteDraft.customer_id) {
          setQuoteDraft(prev => ({ ...prev, customer_id: cRes.clients[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === parseInt(tmplId));
    if (!tmpl) return;

    setQuoteDraft({
      ...quoteDraft,
      template_id: tmpl.id,
      plan_id: tmpl.plan_id || quoteDraft.plan_id,
      valid_days: tmpl.valid_days,
      items: tmpl.default_lines.length > 0 ? tmpl.default_lines : quoteDraft.items
    });
  };

  const handleAddItem = () => {
    setQuoteDraft({
      ...quoteDraft,
      items: [
        ...quoteDraft.items,
        { product_id: 1, variant_id: null, variant_name: '', quantity: 1, unit_price: 1000.00, tax_rate: 18.00 }
      ]
    });
  };

  const handleRemoveItem = (idx) => {
    const updated = [...quoteDraft.items];
    updated.splice(idx, 1);
    setQuoteDraft({ ...quoteDraft, items: updated });
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...quoteDraft.items];
    updated[idx][field] = value;

    // Recalculate price if product or variant changes
    if (field === 'product_id' || field === 'variant_id') {
      const prod = products.find(p => p.id === parseInt(updated[idx].product_id));
      if (prod) {
        let price = parseFloat(prod.sales_price);
        if (updated[idx].variant_id) {
          const v = prod.variants?.find(vr => vr.id === parseInt(updated[idx].variant_id));
          if (v) {
            price += parseFloat(v.price_modifier);
            updated[idx].variant_name = `${v.attribute_value} (+${v.price_modifier})`;
          }
        } else {
          updated[idx].variant_name = '';
        }
        updated[idx].unit_price = price;
      }
    }

    setQuoteDraft({ ...quoteDraft, items: updated });
  };

  // Calculations
  const subtotal = quoteDraft.items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!quoteDraft.customer_id) {
      alert('Please select a client account');
      return;
    }

    try {
      const res = await subscriptionService.createQuote({
        customer_id: quoteDraft.customer_id,
        plan_id: quoteDraft.plan_id,
        template_id: quoteDraft.template_id || null,
        valid_days: quoteDraft.valid_days,
        payment_terms: quoteDraft.payment_terms,
        notes: quoteDraft.notes,
        items: quoteDraft.items
      });

      if (res.success) {
        setIsCreateQuoteOpen(false);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating quotation');
    }
  };

  const handleConvertQuote = async (quoteId) => {
    try {
      const res = await subscriptionService.convertQuote(quoteId);
      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        alert(`Quote accepted! Converted to Active Subscription #${res.subscription?.subscription_number}`);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error converting quote');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quotation Builder & Offers</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Build custom quotations for clients, apply templates, calculate taxes & brand variants, and convert in 1-click
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onViewChange('client-management')} className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Clients</span>
          </button>
          <button onClick={() => setIsCreateQuoteOpen(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Create New Quote</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading quotations...</div>
      ) : quotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileEdit size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No quotations created yet</h3>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0', fontSize: '0.875rem' }}>
            Select a client and package line items with 18% GST tax calculation.
          </p>
          <button onClick={() => setIsCreateQuoteOpen(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Plus size={16} />
            <span>Draft First Quotation</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {quotes.map((quote) => (
            <div key={quote.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                      {quote.subscription_number}
                    </span>
                    <StatusBadge status={quote.status} />
                    {quote.plan_name && (
                      <span className="badge badge-quotation">{quote.plan_name}</span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.4rem' }}>
                    Client: <strong style={{ color: '#fff' }}>{quote.customer_name}</strong> {quote.customer_company ? `(${quote.customer_company})` : ''} • {quote.customer_email}
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Created: {quote.start_date} • Expires: {quote.expiry_date || 'N/A'} • Terms: {quote.payment_terms}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Quoted Total (inc. 18% GST)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                      ${(quote.items?.reduce((s, it) => s + it.amount, 0) * 1.18 || 0).toFixed(2)}
                    </div>
                  </div>

                  {quote.status === 'Quotation' && (
                    <button
                      onClick={() => handleConvertQuote(quote.id)}
                      className="btn btn-success"
                      style={{ padding: '0.6rem 1rem' }}
                    >
                      <CheckCircle size={16} />
                      <span>Convert to Active Subscription</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Line Items Details */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <th style={{ padding: '0.4rem 0' }}>Product / Variant</th>
                      <th style={{ padding: '0.4rem 0', textAlign: 'center' }}>Quantity</th>
                      <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ padding: '0.4rem 0', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items?.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                        <td style={{ padding: '0.5rem 0', color: '#f8fafc' }}>
                          <strong>{it.product_name}</strong>
                          {it.variant_name && (
                            <span style={{ color: '#818cf8', marginLeft: '0.5rem' }}>
                              [{it.variant_name}]
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'center', color: '#cbd5e1' }}>{it.quantity}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#cbd5e1' }}>${it.unit_price.toFixed(2)}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>${it.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Quotation */}
      <Modal
        isOpen={isCreateQuoteOpen}
        onClose={() => setIsCreateQuoteOpen(false)}
        title="Draft Client Quotation & Proposal"
        maxWidth="800px"
      >
        <form onSubmit={handleCreateQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Apply Template */}
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="#818cf8" />
              <span style={{ fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: 600 }}>Quick-fill from Quotation Template:</span>
            </div>
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '220px', padding: '0.35rem 0.6rem' }}
              value={quoteDraft.template_id}
              onChange={(e) => handleApplyTemplate(e.target.value)}
            >
              <option value="">-- Choose a Template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.valid_days}d valid)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Client Account *
              </label>
              <select
                required
                className="form-input"
                value={quoteDraft.customer_id}
                onChange={(e) => setQuoteDraft({ ...quoteDraft, customer_id: parseInt(e.target.value) })}
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''} - {c.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Subscription Plan
              </label>
              <select
                className="form-input"
                value={quoteDraft.plan_id}
                onChange={(e) => setQuoteDraft({ ...quoteDraft, plan_id: parseInt(e.target.value) })}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.billing_frequency})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Validity (Days)
              </label>
              <input
                type="number"
                className="form-input"
                value={quoteDraft.valid_days}
                onChange={(e) => setQuoteDraft({ ...quoteDraft, valid_days: parseInt(e.target.value) || 15 })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Payment Terms
              </label>
              <select
                className="form-input"
                value={quoteDraft.payment_terms}
                onChange={(e) => setQuoteDraft({ ...quoteDraft, payment_terms: e.target.value })}
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Immediate Net 0">Immediate Net 0</option>
                <option value="End of Month">End of Month</option>
              </select>
            </div>
          </div>

          {/* Line items editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>
                Quotation Line Items & Variant Modifiers
              </span>
              <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                <Plus size={14} /> Add Product Line
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quoteDraft.items.map((it, idx) => {
                const prod = products.find(p => p.id === parseInt(it.product_id));
                const availableVariants = prod?.variants || [];

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr auto', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                    <select
                      className="form-input"
                      value={it.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.sales_price})</option>
                      ))}
                    </select>

                    <select
                      className="form-input"
                      value={it.variant_id || ''}
                      onChange={(e) => handleItemChange(idx, 'variant_id', e.target.value || null)}
                    >
                      <option value="">No Variant / Base Price</option>
                      {availableVariants.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.attribute_value} {v.price_modifier > 0 ? `(+${v.price_modifier})` : ''}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ textAlign: 'center' }}
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />

                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', fontSize: '0.875rem' }}>
                      ${(it.quantity * it.unit_price).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>GST Tax (18%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: '#38bdf8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.35rem' }}>
                <span>Quotation Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateQuoteOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Official Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
