import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { StatusBadge } from '../../components/common/UIComponents';
import { FolderKanban, Pause, Play, XCircle, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MySubscriptionsView = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getMySubscriptions();
      if (res.success) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      console.error('Error loading my subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleUpdateStatus = async (subId, newStatus) => {
    try {
      const res = await subscriptionService.updateStatus(subId, newStatus);
      if (res.success) {
        loadSubscriptions();
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
        loadSubscriptions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error renewing subscription');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Subscriptions</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Self-manage your software plans without needing to email support: pause, resume, or renew anytime
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading subscriptions...</div>
      ) : subscriptions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FolderKanban size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No subscriptions found</h3>
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
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Started: {sub.start_date} • Next Billing: {sub.next_billing_date || 'N/A'} • Expires: {sub.expiry_date || 'Ongoing'}
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
    </div>
  );
};
