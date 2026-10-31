import React, { useState, useEffect } from 'react';
import { productService } from '../../api/productService';
import { Modal, StatusBadge } from '../../components/common/UIComponents';
import { Layers, Plus, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const PlanManagementView = () => {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);

  const [newPlan, setNewPlan] = useState({
    product_id: '',
    name: '',
    billing_frequency: 'monthly',
    price: '',
    min_quantity: 1,
    start_date: '',
    end_date: '',
    auto_close: false,
    allow_pause: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodsRes] = await Promise.all([
        productService.getPlans(),
        productService.getProducts()
      ]);
      if (plansRes.success) setPlans(plansRes.plans);
      if (prodsRes.success) {
        setProducts(prodsRes.products);
        if (prodsRes.products.length > 0 && !newPlan.product_id) {
          setNewPlan(prev => ({ ...prev, product_id: prodsRes.products[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await productService.addPlan(newPlan.product_id, newPlan);
      if (res.success) {
        setIsAddPlanOpen(false);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating plan');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Recurring Plans Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Define billing frequencies, minimum seats, auto-close expiration rules, and pause controls
          </p>
        </div>
        <button onClick={() => setIsAddPlanOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Configure New Plan</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Layers size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No plans configured</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {plans.map((plan) => (
            <div key={plan.id} className="glass-panel glass-card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{plan.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, marginTop: '0.1rem' }}>
                      {plan.product_name || 'Software Plan'}
                    </div>
                  </div>
                  <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>
                    {plan.billing_frequency}
                  </span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
                    ${plan.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#94a3b8' }}>
                      /{plan.billing_frequency === 'yearly' ? 'yr' : plan.billing_frequency === 'weekly' ? 'wk' : plan.billing_frequency === 'daily' ? 'day' : 'mo'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Min Order Quantity: <strong style={{ color: '#cbd5e1' }}>{plan.min_quantity} seat(s)</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Allows Pause/Resume:</span>
                    <span style={{ color: plan.allow_pause ? '#10b981' : '#f87171', fontWeight: 600 }}>
                      {plan.allow_pause ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Auto-close at end date:</span>
                    <span style={{ color: plan.auto_close ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                      {plan.auto_close ? 'Enabled' : 'Disabled (Renews)'}
                    </span>
                  </div>
                  {plan.start_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Availability:</span>
                      <span style={{ color: '#cbd5e1' }}>
                        {plan.start_date} to {plan.end_date || 'Ongoing'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Configure Plan */}
      <Modal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        title="Configure Recurring Subscription Plan"
      >
        <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Base Product
            </label>
            <select
              className="form-input"
              required
              value={newPlan.product_id}
              onChange={(e) => setNewPlan({ ...newPlan, product_id: e.target.value })}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (${p.sales_price})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Plan Name
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. ERP Cloud Monthly (Standard)"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Billing Frequency
              </label>
              <select
                className="form-input"
                value={newPlan.billing_frequency}
                onChange={(e) => setNewPlan({ ...newPlan, billing_frequency: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Plan Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="1000.00"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Minimum Quantity (Seats)
            </label>
            <input
              type="number"
              min="1"
              required
              className="form-input"
              value={newPlan.min_quantity}
              onChange={(e) => setNewPlan({ ...newPlan, min_quantity: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={newPlan.start_date}
                onChange={(e) => setNewPlan({ ...newPlan, start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                End Date (Optional)
              </label>
              <input
                type="date"
                className="form-input"
                value={newPlan.end_date}
                onChange={(e) => setNewPlan({ ...newPlan, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Lifecycle Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newPlan.allow_pause}
                onChange={(e) => setNewPlan({ ...newPlan, allow_pause: e.target.checked })}
              />
              <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                Allow Customer / Staff to Pause & Resume subscription
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newPlan.auto_close}
                onChange={(e) => setNewPlan({ ...newPlan, auto_close: e.target.checked })}
              />
              <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                Auto-close subscription on its end date (instead of automatic renewal)
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddPlanOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
