import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionService } from '../../api/subscriptionService';
import { invoiceService } from '../../api/invoiceService';
import { StatCard, StatusBadge } from '../../components/common/UIComponents';
import { FolderKanban, Receipt, CreditCard, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
        if (invRes.success) setInvoices(invRes.invoices);
      } catch (err) {
        console.error('Error loading customer portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPortalData();
  }, []);

  const activeSubs = subscriptions.filter(s => s.status === 'Active');
  const unpaidInvoices = invoices.filter(i => i.status !== 'Paid');
  const totalDue = unpaidInvoices.reduce((sum, i) => sum + i.amount_due, 0);

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Welcome to Your Self-Service Portal
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Logged in as <strong style={{ color: '#fff' }}>{user?.name}</strong> • {user?.company || 'Personal Account'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Active Subscriptions"
          value={activeSubs.length}
          subtitle={`${subscriptions.length} total across all time`}
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

      {/* Grid of Subscriptions and Recent Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Active Subscriptions Box */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Your Active Services</h3>
            <button
              onClick={() => onViewChange('my-subscriptions')}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>Manage All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {activeSubs.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>
              No active subscriptions right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeSubs.map(s => (
                <div key={s.id} style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{s.plan_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Ref: #{s.subscription_number} • Billed {s.billing_frequency}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices Box */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Invoices & Receipts</h3>
            <button
              onClick={() => onViewChange('my-invoices')}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {invoices.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>
              No invoices generated yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {invoices.slice(0, 4).map(inv => (
                <div key={inv.id} style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0.625rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Due: {inv.due_date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>${inv.total_amount.toFixed(2)}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
