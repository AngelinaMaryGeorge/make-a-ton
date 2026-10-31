import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { productService } from '../../api/productService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { FolderKanban, Pause, Play, XCircle, RefreshCw, Calendar, CheckCircle, Package, PlusCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MySubscriptionsView = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, plansRes] = await Promise.all([
        subscriptionService.getMySubscriptions(),
        productService.getPlans()
      ]);
      if (subsRes.success) setSubscriptions(subsRes.subscriptions);
      if (plansRes.success) setAvailablePlans(plansRes.plans);
    } catch (err) {
      console.error('Error loading my subscriptions & plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (subId, newStatus) => {
    try {
      const res = await subscriptionService.updateStatus(subId, newStatus);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleRenew = async (subId) => {
    try {
      const res = await subscriptionService.renewSubscription(subId);
      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        alert('Subscription renewed successfully for another year!');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error renewing subscription');
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setSubscribingPlanId(plan.id);
      setErrorMessage('');
      setSuccessMessage('');
      const today = new Date().toISOString().split('T')[0];
      const res = await subscriptionService.createSubscription({
        plan_id: plan.id,
        status: 'Active',
        start_date: today,
        payment_terms: 'Immediate Net 0',
        items: [
          {
            product_id: plan.product_id,
            description: `${plan.product_name} - ${plan.billing_frequency} recurring plan`,
            quantity: plan.min_quantity || 1,
            unit_price: plan.sales_price || 0,
            amount: (plan.sales_price || 0) * (plan.min_quantity || 1)
          }
        ]
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 70 });
        setSuccessMessage(`Successfully subscribed to ${plan.product_name} (${plan.billing_frequency})!`);
        setIsBrowseOpen(false);
        await loadData();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error creating subscription');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Subscriptions</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Self-manage your software plans: browse available plans, subscribe, view upcoming renewals, or pause/resume anytime
          </p>
        </div>
        <button onClick={() => setIsBrowseOpen(true)} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Browse Available Plans & Subscribe</span>
        </button>
      </div>

      {successMessage && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem' }}>
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading subscriptions...</div>
      ) : subscriptions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FolderKanban size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No active subscriptions yet</h3>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0', fontSize: '0.875rem' }}>
            Explore our curated catalog of software plans and subscribe in seconds.
          </p>
          <button onClick={() => setIsBrowseOpen(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Package size={16} />
            <span>Explore Catalog Plans</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {subscriptions.map((sub) => (
            <div key={sub.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                      {sub.subscription_number}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: '#f8fafc' }}>
                    {sub.plan_name}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Billing Interval: <strong style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{sub.billing_frequency}</strong> • Terms: {sub.payment_terms}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Started: <strong style={{ color: '#94a3b8' }}>{sub.start_date}</strong></span>
                    <span>Upcoming Renewal / Next Billing: <strong style={{ color: '#38bdf8' }}>{sub.next_billing_date || 'Calculated on cycle'}</strong></span>
                    <span>Expires: <strong style={{ color: '#94a3b8' }}>{sub.expiry_date || 'Ongoing'}</strong></span>
                  </div>
                </div>

                {/* Self-Service Action Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {sub.status === 'Active' && sub.allow_pause && (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'Paused')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
                    >
                      <Pause size={14} />
                      <span>Pause Subscription</span>
                    </button>
                  )}

                  {sub.status === 'Paused' && (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'Active')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
                    >
                      <Play size={14} />
                      <span>Resume Subscription</span>
                    </button>
                  )}

                  {sub.status !== 'Closed' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to close this subscription?')) {
                          handleUpdateStatus(sub.id, 'Closed');
                        }
                      }}
                      className="btn btn-danger"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
                    >
                      <XCircle size={14} />
                      <span>Close Early</span>
                    </button>
                  )}

                  {sub.status === 'Closed' && (
                    <button
                      onClick={() => handleRenew(sub.id)}
                      className="btn btn-success"
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
                    >
                      <RefreshCw size={14} />
                      <span>Renew Subscription</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items included in this subscription */}
              {sub.items && sub.items.length > 0 && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Subscribed Products & Add-ons:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.6rem' }}>
                    {sub.items.map((item, idx) => (
                      <div key={idx} style={{
                        padding: '0.6rem 0.85rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.product_name}</div>
                          {item.variant_name && (
                            <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{item.variant_name}</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#94a3b8' }}>Qty: {item.quantity}</span>
                          <div style={{ fontWeight: 700, color: '#34d399' }}>${item.amount.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Browse Available Plans & Subscribe */}
      <Modal
        isOpen={isBrowseOpen}
        onClose={() => setIsBrowseOpen(false)}
        title="Browse Available Subscription Plans"
        maxWidth="800px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Choose an enterprise software plan configured by Brightloop. Instant activation connects directly to your customer dashboard.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>{plan.product_name}</h3>
                    <span className="badge badge-quotation" style={{ textTransform: 'capitalize' }}>
                      {plan.billing_frequency}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.5rem' }}>
                    ${parseFloat(plan.sales_price || 0).toFixed(2)}
                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 400 }}> / {plan.billing_frequency}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', fontSize: '0.8125rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} color="#34d399" /> Min Order: {plan.min_quantity} seat(s)
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} color="#34d399" /> Pause & Resume: {plan.allow_pause ? 'Allowed' : 'Locked'}
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Check size={14} color="#34d399" /> Automatic Recurring Invoices
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribingPlanId === plan.id}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {subscribingPlanId === plan.id ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
