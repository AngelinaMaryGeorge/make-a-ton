import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../../api/subscriptionService';
import { authService } from '../../api/authService';
import { productService } from '../../api/productService';
import { StatusBadge, Modal } from '../../components/common/UIComponents';
import { FolderKanban, PlusCircle, Pause, Play, RefreshCw, XCircle, Filter, Calendar, Building, User } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ClientSubscriptionsView = ({ onViewChange }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // New Subscription Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSub, setNewSub] = useState({
    customer_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_terms: 'Net 30',
    status: 'Active'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, clientsRes, plansRes] = await Promise.all([
        subscriptionService.getSubscriptions(),
        authService.getClients(),
        productService.getPlans()
      ]);

      if (subsRes.success) setSubscriptions(subsRes.subscriptions || []);
      if (clientsRes.success) setClients(clientsRes.clients || []);
      if (plansRes.success) setPlans(plansRes.plans || []);
    } catch (err) {
      console.error('Error loading client subscriptions:', err);
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
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating subscription status');
    }
  };

  const handleRenew = async (subId) => {
    try {
      const res = await subscriptionService.renewSubscription(subId);
      if (res.success) {
        confetti({ particleCount: 70, spread: 60 });
        alert('Subscription renewed successfully for another year!');
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error renewing subscription');
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!newSub.customer_id || !newSub.plan_id) {
      alert('Please select both a client and a plan');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPlan = plans.find(p => p.id === parseInt(newSub.plan_id));
      const res = await subscriptionService.createSubscription({
        customer_id: parseInt(newSub.customer_id),
        plan_id: parseInt(newSub.plan_id),
        status: newSub.status,
        start_date: newSub.start_date,
        payment_terms: newSub.payment_terms,
        items: [
          {
            product_id: selectedPlan?.product_id || 1,
            description: `${selectedPlan?.product_name || 'Enterprise Service'} - ${selectedPlan?.billing_frequency || 'monthly'} plan`,
            quantity: selectedPlan?.min_quantity || 1,
            unit_price: selectedPlan?.sales_price || 0,
            amount: (selectedPlan?.sales_price || 0) * (selectedPlan?.min_quantity || 1)
          }
        ]
      });

      if (res.success) {
        confetti({ particleCount: 80, spread: 70 });
        setIsCreateOpen(false);
        setNewSub({
          customer_id: '',
          plan_id: '',
          start_date: new Date().toISOString().split('T')[0],
          payment_terms: 'Net 30',
          status: 'Active'
        });
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    const matchClient = selectedClientFilter === 'ALL' || String(s.customer_id) === String(selectedClientFilter);
    const matchStatus = selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;
    return matchClient && matchStatus;
  });

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Client Subscriptions</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Manage recurring plans, lifecycle states (active, pause, renew, close), and billing frequencies across all your clients
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Client Subscription</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Filter by Client:</span>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '180px', padding: '0.35rem 0.6rem' }}
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
          >
            <option value="ALL">All Clients ({clients.length})</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '0.35rem 0.6rem' }}
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Quotation">Quotation</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#94a3b8' }}>
          Showing <strong>{filteredSubs.length}</strong> subscriptions
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading subscriptions...</div>
      ) : filteredSubs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <FolderKanban size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No client subscriptions found</h3>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0', fontSize: '0.875rem' }}>
            Get started by creating a recurring subscription for one of your clients.
          </p>
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <PlusCircle size={16} />
            <span>Create Subscription</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSubs.map((sub) => (
            <div key={sub.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                      {sub.subscription_number}
                    </span>
                    <StatusBadge status={sub.status} />
                    <span className="badge badge-quotation" style={{ textTransform: 'capitalize' }}>
                      {sub.billing_frequency}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{sub.plan_name}</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <User size={13} /> {sub.customer_name} {sub.customer_company ? `(${sub.customer_company})` : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Started: <strong style={{ color: '#94a3b8' }}>{sub.start_date}</strong></span>
                    <span>Next Billing: <strong style={{ color: '#38bdf8' }}>{sub.next_billing_date || 'N/A'}</strong></span>
                    <span>Expires: <strong style={{ color: '#94a3b8' }}>{sub.expiry_date || 'Ongoing'}</strong></span>
                    <span>Terms: <strong style={{ color: '#94a3b8' }}>{sub.payment_terms || 'Net 30'}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sub.status === 'Active' && (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'Paused')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.8rem' }}
                    >
                      <Pause size={14} />
                      <span>Pause</span>
                    </button>
                  )}

                  {sub.status === 'Paused' && (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'Active')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.8rem' }}
                    >
                      <Play size={14} />
                      <span>Resume</span>
                    </button>
                  )}

                  {sub.status === 'Quotation' && (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'Active')}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.8rem' }}
                    >
                      <span>Activate Plan</span>
                    </button>
                  )}

                  {sub.status !== 'Closed' && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to close subscription ${sub.subscription_number}?`)) {
                          handleUpdateStatus(sub.id, 'Closed');
                        }
                      }}
                      className="btn btn-danger"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.8rem' }}
                    >
                      <XCircle size={14} />
                      <span>Close</span>
                    </button>
                  )}

                  {sub.status === 'Closed' && (
                    <button
                      onClick={() => handleRenew(sub.id)}
                      className="btn btn-success"
                      style={{ fontSize: '0.8125rem', padding: '0.45rem 0.8rem' }}
                    >
                      <RefreshCw size={14} />
                      <span>Renew 1 Year</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subscribed Items */}
              {sub.items && sub.items.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {sub.items.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '0.35rem 0.65rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.75rem',
                      color: '#cbd5e1'
                    }}>
                      <strong style={{ color: '#f8fafc' }}>{item.product_name}</strong> (Qty: {item.quantity}) • ${item.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Client Subscription */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Subscription for Client"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Select Client *
            </label>
            <select
              required
              className="form-input"
              value={newSub.customer_id}
              onChange={(e) => setNewSub({ ...newSub, customer_id: e.target.value })}
            >
              <option value="">-- Choose Client Account --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''} - {c.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Select Subscription Plan *
            </label>
            <select
              required
              className="form-input"
              value={newSub.plan_id}
              onChange={(e) => setNewSub({ ...newSub, plan_id: e.target.value })}
            >
              <option value="">-- Choose Recurring Plan --</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_name} - ${parseFloat(p.sales_price || 0).toFixed(2)} / {p.billing_frequency}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Start Date
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={newSub.start_date}
                onChange={(e) => setNewSub({ ...newSub, start_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Payment Terms
              </label>
              <select
                className="form-input"
                value={newSub.payment_terms}
                onChange={(e) => setNewSub({ ...newSub, payment_terms: e.target.value })}
              >
                <option value="Immediate Net 0">Immediate Net 0</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="End of Month">End of Month</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Initial State
            </label>
            <select
              className="form-input"
              value={newSub.status}
              onChange={(e) => setNewSub({ ...newSub, status: e.target.value })}
            >
              <option value="Active">Active (Immediately Billed & Service Enabled)</option>
              <option value="Quotation">Quotation (Awaiting Client Confirmation)</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Provision Subscription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

