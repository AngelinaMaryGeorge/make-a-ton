import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { productService } from '../../api/productService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { FileEdit, Plus, CheckCircle, ArrowRight, Sparkles, Trash2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuotationEditorView = ({ onViewChange }) => {
  const [quotes, setQuotes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  // New quote draft state
  const [quoteDraft, setQuoteDraft] = useState({
    customer_id: 3, // Default Acme Corp
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
      const [qRes, tRes, plRes, prRes] = await Promise.all([
        subscriptionService.getQuotes(),
        subscriptionService.getQuoteTemplates(),
        productService.getPlans(),
        productService.getProducts()
      ]);
      if (qRes.success) setQuotes(qRes.quotes);
      if (tRes.success) setTemplates(tRes.templates);
      if (plRes.success) setPlans(plRes.plans);
      if (prRes.success) setProducts(prRes.products);
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTemplateSelect = (templateId) => {
    const tpl = templates.find(t => t.id === parseInt(templateId));
    if (tpl) {
      setQuoteDraft(prev => ({
        ...prev,
        template_id: tpl.id,
        plan_id: tpl.plan_id || prev.plan_id,
        valid_days: tpl.valid_days || 15,
        notes: tpl.description || '',
        items: tpl.default_lines && tpl.default_lines.length > 0 ? tpl.default_lines : prev.items
      }));
    }
  };

  const addItemToDraft = () => {
    setQuoteDraft(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { product_id: 1, variant_id: null, variant_name: '', quantity: 1, unit_price: 1000.00, tax_rate: 18.00 }
      ]
    }));
  };

  const removeItemFromDraft = (index) => {
    setQuoteDraft(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleProductChange = (index, prodId) => {
    const p = products.find(prod => prod.id === parseInt(prodId));
    if (!p) return;

    setQuoteDraft(prev => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        product_id: p.id,
        unit_price: p.sales_price,
        variant_id: null,
        variant_name: ''
      };
      return { ...prev, items: updated };
    });
  };

  const handleVariantChange = (index, variantId) => {
    const item = quoteDraft.items[index];
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return;

    const v = p.variants.find(vr => vr.id === parseInt(variantId));
    const modifier = v ? v.price_modifier : 0;
    const basePrice = p.sales_price;

    setQuoteDraft(prev => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        variant_id: v ? v.id : null,
        variant_name: v ? `${v.attribute_value} (+$${v.price_modifier})` : '',
        unit_price: basePrice + modifier
      };
      return { ...prev, items: updated };
    });
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    try {
      const res = await subscriptionService.createQuote(quoteDraft);
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
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error converting quote');
    }
  };

  // Calculate live totals for the draft
  const draftSubtotal = quoteDraft.items.reduce((sum, it) => sum + ((it.quantity || 1) * (it.unit_price || 0)), 0);
  const draftTax = draftSubtotal * 0.18;
  const draftTotal = draftSubtotal + draftTax;

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quotation Builder & Active Offers</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Build customized subscription offers and instantly convert accepted quotes into active recurring subscriptions
          </p>
        </div>
        <button onClick={() => setIsCreateQuoteOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Prepare New Offer</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading offers...</div>
      ) : quotes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileEdit size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No quotations created yet</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {quotes.map((quote) => (
            <div key={quote.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                      {quote.quote_number}
                    </span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                    Client: <strong style={{ color: '#fff' }}>{quote.customer_name}</strong> {quote.customer_company ? `(${quote.customer_company})` : ''} • {quote.customer_email}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Plan: <span style={{ color: '#818cf8', fontWeight: 600 }}>{quote.plan_name}</span> • Terms: {quote.payment_terms} • Valid until: {quote.valid_until}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                    ${parseFloat(quote.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Subtotal: ${parseFloat(quote.subtotal).toFixed(2)} + Tax (18%): ${parseFloat(quote.tax_amount).toFixed(2)}
                  </div>

                  {quote.status !== 'Converted' ? (
                    <button
                      onClick={() => handleConvertQuote(quote.id)}
                      className="btn btn-success"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', marginTop: '0.25rem' }}
                    >
                      <Sparkles size={16} />
                      <span>Convert to Active Subscription</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.8125rem', fontWeight: 700 }}>
                      <CheckCircle size={16} />
                      <span>Converted to Active Subscription</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line items preview */}
              {quote.items && quote.items.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Offer Line Items:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
                    {quote.items.map((it, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>
                          {it.quantity}x {it.product_name} {it.variant_name ? `(${it.variant_name})` : ''}
                        </span>
                        <strong style={{ color: '#f8fafc' }}>${it.amount.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Quotation */}
      <Modal
        isOpen={isCreateQuoteOpen}
        onClose={() => setIsCreateQuoteOpen(false)}
        title="Prepare Client Subscription Quotation"
        maxWidth="750px"
      >
        <form onSubmit={handleCreateQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Reusable Template Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Load From Reusable Template (Optional)
            </label>
            <select
              className="form-input"
              value={quoteDraft.template_id}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="">-- Start from scratch --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.valid_days} days)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Customer Account
              </label>
              <select
                className="form-input"
                value={quoteDraft.customer_id}
                onChange={(e) => setQuoteDraft({ ...quoteDraft, customer_id: parseInt(e.target.value) })}
              >
                <option value="3">Acme Corporation (customer@example.com)</option>
                <option value="4">Zenith Labs Ltd (zenith@example.com)</option>
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
                min="1"
                required
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
                <option value="Immediate">Immediate</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#cbd5e1' }}>
                Line Items (Products & Variants)
              </span>
              <button
                type="button"
                onClick={addItemToDraft}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quoteDraft.items.map((it, idx) => {
                const currentProd = products.find(p => p.id === it.product_id);
                return (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem'
                  }}>
                    {/* Product */}
                    <select
                      className="form-input"
                      style={{ padding: '0.4rem' }}
                      value={it.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    {/* Variant */}
                    <select
                      className="form-input"
                      style={{ padding: '0.4rem' }}
                      value={it.variant_id || ''}
                      onChange={(e) => handleVariantChange(idx, e.target.value)}
                    >
                      <option value="">Standard (No Variant)</option>
                      {currentProd?.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.attribute_value} (+${v.price_modifier})</option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ padding: '0.4rem' }}
                      value={it.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        setQuoteDraft(prev => {
                          const updated = [...prev.items];
                          updated[idx].quantity = qty;
                          return { ...prev, items: updated };
                        });
                      }}
                    />

                    {/* Unit Price */}
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', textAlign: 'right' }}>
                      ${(it.unit_price * it.quantity).toFixed(2)}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItemFromDraft(idx)}
                      disabled={quoteDraft.items.length <= 1}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', opacity: quoteDraft.items.length <= 1 ? 0.3 : 1 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tax Calculated: GST 18% (${draftTax.toFixed(2)})</div>
              <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>Subtotal: ${draftSubtotal.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estimated Total:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                ${draftTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateQuoteOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate & Send Offer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
