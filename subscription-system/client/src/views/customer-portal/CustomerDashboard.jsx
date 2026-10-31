import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionService } from '../../api/subscriptionService';
import { invoiceService } from '../../api/invoiceService';
import { StatCard, StatusBadge, LoadingBlock, EmptyState } from '../../components/common/UIComponents';
import { FolderKanban, Receipt, CreditCard, ArrowRight, ShieldCheck, PlusCircle, Zap } from 'lucide-react';

export const CustomerDashboard = ({ onViewChange }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setLoading(true);
        const [subsRes, invRes] = await Promise.all([
          subscriptionService.getMySubscriptions(),
          invoiceService.getMyInvoices()
        ]);
        if (subsRes.success) setSubscriptions(subsRes.subscriptions);
        if (invRes.success)  setInvoices(invRes.invoices);
      } catch (err) {
        console.error('Error loading customer portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPortalData();
  }, []);

  const activeSubs     = subscriptions.filter(s => s.status === 'Active');
  const unpaidInvoices = invoices.filter(i => i.status !== 'Paid');
  const totalDue       = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount_due) || 0), 0);

  return (
    <div style={{ padding: '0 1rem 2rem 0.25rem' }}>

      {/* Hero Banner */}
      <div className="hero-banner animate-fade-in-up" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '13px',
            background: 'rgba(99,102,241,0.22)', border: '1px solid rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <ShieldCheck size={24} color="#a5b4fc" />
          </div>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>Self-Service Portal</span>
            <h1 className="page-title" style={{ marginTop: '0.1rem', fontSize: '1.5rem' }}>
              Welcome, {user?.name || 'Customer'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.15rem' }}>
              {user?.company || 'Personal Account'} · Data isolated to your account only
            </p>
          </div>
        </div>
        <button onClick={() => onViewChange('my-subscriptions')} className="btn btn-primary">
          <PlusCircle size={15} /><span>Browse Plans</span>
        </button>
      </div>

      {loading ? (
        <LoadingBlock message="Loading your account data..." />
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.1rem', marginBottom: '1.75rem' }}>
            <StatCard
              title="Active Subscriptions"
              value={activeSubs.length}
              subtitle={`${subscriptions.length} total (all time)`}
              icon={FolderKanban}
              color="#10b981"
            />
            <StatCard
              title="Pending Invoices"
              value={unpaidInvoices.length}
              subtitle={`$${totalDue.toFixed(2)} balance due`}
              icon={Receipt}
              color="#f59e0b"
            />
            <StatCard
              title="Invoices Settled"
              value={invoices.filter(i => i.status === 'Paid').length}
              subtitle="All receipts ready for download"
              icon={CreditCard}
              color="#6366f1"
            />
          </div>

          {/* Content Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

            {/* Active Subscriptions */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Your Active Services</h3>
                <button onClick={() => onViewChange('my-subscriptions')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Manage All <ArrowRight size={13} />
                </button>
              </div>

              {activeSubs.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title="No active services"
                  description='Click "Browse Plans" above to subscribe to a plan.'
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeSubs.map(s => (
                    <div key={s.id} className="list-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{s.plan_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                          #{s.subscription_number} · Billed {s.billing_frequency}
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Invoices</h3>
                <button onClick={() => onViewChange('my-invoices')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  View All <ArrowRight size={13} />
                </button>
              </div>

              {invoices.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No invoices generated yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {invoices.slice(0, 4).map(inv => (
                    <div key={inv.id} className="list-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>{inv.invoice_number}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                          Due: {inv.due_date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.875rem' }}>${parseFloat(inv.total_amount || 0).toFixed(2)}</div>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
