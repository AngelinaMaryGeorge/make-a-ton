import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { productService } from '../../api/productService';
import { Modal } from '../../components/common/UIComponents';
import { FileText, Plus, Clock, Layers, ArrowRight } from 'lucide-react';

export const QuotationTemplatesView = ({ onViewChange }) => {
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    plan_id: '',
    valid_days: 15,
    description: '',
    default_lines: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tplRes, plnRes, prdRes] = await Promise.all([
        subscriptionService.getQuoteTemplates(),
        productService.getPlans(),
        productService.getProducts()
      ]);
      if (tplRes.success) setTemplates(tplRes.templates);
      if (plnRes.success) {
        setPlans(plnRes.plans);
        if (plnRes.plans.length > 0 && !newTemplate.plan_id) {
          setNewTemplate(prev => ({ ...prev, plan_id: plnRes.plans[0].id }));
        }
      }
      if (prdRes.success) setProducts(prdRes.products);
    } catch (err) {
      console.error('Error loading quotation templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const res = await subscriptionService.createQuoteTemplate(newTemplate);
      if (res.success) {
        setIsAddTemplateOpen(false);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating template');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quotation Templates</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Preconfigured offers with bundled plans, product lines, and predefined validity windows
          </p>
        </div>
        <button onClick={() => setIsAddTemplateOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>New Quotation Template</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading quotation templates...</div>
      ) : templates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FileText size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No templates found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {templates.map((tpl) => (
            <div key={tpl.id} className="glass-panel glass-card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{tpl.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, marginTop: '0.1rem' }}>
                      {tpl.plan_name || 'Standard Plan'}
                    </div>
                  </div>
                  <span className="badge badge-quotation" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    <span>{tpl.valid_days} Days Validity</span>
                  </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.75rem 0' }}>
                  {tpl.description || 'Pre-configured sales template with standard discount rules and tax lines.'}
                </p>

                {/* Bundle items breakdown */}
                {tpl.default_lines && tpl.default_lines.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Bundled Line Items:
                    </div>
                    {tpl.default_lines.map((line, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>
                        <span>
                          {line.quantity}x {line.variant_name ? `${line.variant_name}` : `Product #${line.product_id}`}
                        </span>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>
                          ${(line.quantity * line.unit_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => onViewChange('quotation-editor')}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '0.55rem' }}
                >
                  <span>Build Offer with This Template</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Quotation Template */}
      <Modal
        isOpen={isAddTemplateOpen}
        onClose={() => setIsAddTemplateOpen(false)}
        title="Create Reusable Quotation Template"
      >
        <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Template Name
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Enterprise Odoo Package"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Default Plan
              </label>
              <select
                className="form-input"
                value={newTemplate.plan_id}
                onChange={(e) => setNewTemplate({ ...newTemplate, plan_id: e.target.value })}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price}/{p.billing_frequency})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Validity Window (Days)
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                placeholder="15"
                value={newTemplate.valid_days}
                onChange={(e) => setNewTemplate({ ...newTemplate, valid_days: parseInt(e.target.value) || 15 })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Offer Description
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Full ERP Cloud with Odoo Brand (+560) plus 24/7 dedicated support..."
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddTemplateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
