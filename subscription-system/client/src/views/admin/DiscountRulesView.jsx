import React, { useState, useEffect } from 'react';
import { reportingService } from '../../api/reportingService';
import { productService } from '../../api/productService';
import { Modal, StatusBadge } from '../../components/common/UIComponents';
import { Percent, Plus, Tag, Calendar, AlertCircle } from 'lucide-react';

export const DiscountRulesView = () => {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDiscountOpen, setIsAddDiscountOpen] = useState(false);

  const [newDiscount, setNewDiscount] = useState({
    code: '',
    name: '',
    type: 'percentage',
    amount: '',
    min_purchase: 0,
    min_quantity: 0,
    usage_limit: 100,
    start_date: '',
    end_date: '',
    applicable_product_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [discRes, prodRes] = await Promise.all([
        reportingService.getDiscounts(),
        productService.getProducts()
      ]);
      if (discRes.success) setDiscounts(discRes.discounts);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error('Error loading discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      const res = await reportingService.createDiscount(newDiscount);
      if (res.success) {
        setIsAddDiscountOpen(false);
        setNewDiscount({
          code: '',
          name: '',
          type: 'percentage',
          amount: '',
          min_purchase: 0,
          min_quantity: 0,
          usage_limit: 100,
          start_date: '',
          end_date: '',
          applicable_product_id: ''
        });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating discount rule');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Discount Rules</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Configure fixed and percentage promotional deductions, volume thresholds, and redemption limits
          </p>
        </div>
        <button onClick={() => setIsAddDiscountOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Create Discount Rule</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading discount rules...</div>
      ) : discounts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Percent size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No discount rules configured</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {discounts.map((discount) => {
            const isExhausted = discount.used_count >= discount.usage_limit;
            return (
              <div key={discount.id} className="glass-panel glass-card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid rgba(99, 102, 241, 0.4)'
                        }}>
                          {discount.code}
                        </span>
                        <StatusBadge status={discount.is_active && !isExhausted ? 'Active' : 'Expired'} />
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.5rem' }}>{discount.name}</h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                        {discount.type === 'percentage' ? `${discount.amount}% OFF` : `-$${discount.amount}`}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        {discount.type} discount
                      </span>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Scope:</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                        {discount.applicable_product_name ? `Product: ${discount.applicable_product_name}` : 'Whole Subscription'}
                      </span>
                    </div>
                    {discount.min_purchase > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Min Purchase:</span>
                        <span style={{ color: '#cbd5e1' }}>${discount.min_purchase}</span>
                      </div>
                    )}
                    {discount.min_quantity > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Min Seats:</span>
                        <span style={{ color: '#cbd5e1' }}>{discount.min_quantity} seat(s)</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Redemptions:</span>
                      <span style={{ color: isExhausted ? '#ef4444' : '#34d399', fontWeight: 600 }}>
                        {discount.used_count} / {discount.usage_limit} used
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Discount Rule */}
      <Modal
        isOpen={isAddDiscountOpen}
        onClose={() => setIsAddDiscountOpen(false)}
        title="Create Admin Discount Rule"
      >
        <form onSubmit={handleCreateDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Promo Code
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. GROWTH15"
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Rule Name
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 15% Volume Discount"
                value={newDiscount.name}
                onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Discount Type
              </label>
              <select
                className="form-input"
                value={newDiscount.type}
                onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Discount Amount {newDiscount.type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder={newDiscount.type === 'percentage' ? '15' : '100.00'}
                value={newDiscount.amount}
                onChange={(e) => setNewDiscount({ ...newDiscount, amount: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Minimum Purchase ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={newDiscount.min_purchase}
                onChange={(e) => setNewDiscount({ ...newDiscount, min_purchase: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Minimum Quantity (Seats)
              </label>
              <input
                type="number"
                className="form-input"
                value={newDiscount.min_quantity}
                onChange={(e) => setNewDiscount({ ...newDiscount, min_quantity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Max Usage Limit
              </label>
              <input
                type="number"
                required
                className="form-input"
                value={newDiscount.usage_limit}
                onChange={(e) => setNewDiscount({ ...newDiscount, usage_limit: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Applies To Product (Optional)
              </label>
              <select
                className="form-input"
                value={newDiscount.applicable_product_id}
                onChange={(e) => setNewDiscount({ ...newDiscount, applicable_product_id: e.target.value })}
              >
                <option value="">Whole Subscription</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={newDiscount.start_date}
                onChange={(e) => setNewDiscount({ ...newDiscount, start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                End Date
              </label>
              <input
                type="date"
                className="form-input"
                value={newDiscount.end_date}
                onChange={(e) => setNewDiscount({ ...newDiscount, end_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddDiscountOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Discount Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
