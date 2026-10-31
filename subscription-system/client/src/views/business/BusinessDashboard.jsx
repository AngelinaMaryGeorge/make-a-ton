import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { subscriptionService } from '../../api/subscriptionService';
import { invoiceService } from '../../api/invoiceService';
import { StatCard, StatusBadge } from '../../components/common/UIComponents';
import { Users, FolderKanban, Receipt, CreditCard, ArrowRight, Building, PlusCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const BusinessDashboard = ({ onViewChange }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [clientsRes, subsRes, invRes] = await Promise.all([
          authService.getClients(),
          subscriptionService.getSubscriptions(),
          invoiceService.getInvoices()
        ]);

        if (clientsRes.success) setClients(clientsRes.clients || []);
        if (subsRes.success) setSubscriptions(subsRes.subscriptions || []);
        if (invRes.success) setInvoices(invRes.invoices || []);
      } catch (err) {
        console.error('Error loading business dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const activeSubs = subscriptions.filter(s => s.status === 'Active');
  const unpaidInvoices = invoices.filter(i => i.status !== 'Paid');
  const totalReceivables = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount_due || i.total_amount) || 0), 0);
  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span className="badge badge-quotation" style={{ textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block' }}>
            Business Workspace
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            Business & Client Management Dashboard
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Logged in as <strong style={{ color: '#fff' }}>{user?.name}</strong> • Manage your clients, their recurring subscriptions, and billing cashflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => onViewChange('client-management')} className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Clients</span>
          </button>
          <button onClick={() => onViewChange('client-subscriptions')} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Manage Subscriptions</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Total Clients Managed"
          value={clients.length}
          subtitle="Corporate accounts"
          icon={Users}
          color="#38bdf8"
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs.length}
          subtitle={`${subscriptions.length} total across all clients`}
          icon={FolderKanban}
          color="#10b981"
        />
        <StatCard
          title="Outstanding Receivables"
          value={`$${totalReceivables.toFixed(2)}`}
          subtitle={`${unpaidInvoices.length} pending client invoices`}
          icon={Receipt}
          color="#f59e0b"
        />
        <StatCard
          title="Revenue Reconciled"
          value={`$${totalCollected.toFixed(2)}`}
          subtitle="Settled in full"
          icon={CreditCard}
          color="#818cf8"
        />
      </div>

      {/* Quick Action Navigation Hub */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
          Business Operations Hub
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div
            onClick={() => onViewChange('client-management')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <Users size={22} />
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Client Management</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Onboard new clients, view corporate profiles, contacts, and active services.
            </p>
          </div>

          <div
            onClick={() => onViewChange('client-subscriptions')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <FolderKanban size={22} />
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Client Subscriptions</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Provision, pause, resume, or renew recurring plans across all your clients.
            </p>
          </div>

          <div
            onClick={() => onViewChange('quotation-editor')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '0.5rem', backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
                <PlusCircle size={22} />
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Quote Builder & Offers</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Draft enterprise proposals with Odoo variant modifiers (+560) and 1-click subscription conversion.
            </p>
          </div>

          <div
            onClick={() => onViewChange('invoice-list')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Receipt size={22} />
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Invoices & Billing Cycles</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Review the automated invoice pipeline and trigger Billing Day runs without duplicates.
            </p>
          </div>
        </div>
      </div>

      {/* Tables: Recent Subscriptions and Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Client Subscriptions */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Client Subscriptions</h3>
            <button
              onClick={() => onViewChange('client-subscriptions')}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', padding: '1rem 0' }}>
              No subscriptions on record.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subscriptions.slice(0, 5).map(s => (
                <div key={s.id} style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{s.subscription_number}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      {s.customer_name} • {s.plan_name} ({s.billing_frequency})
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Client Invoices</h3>
            <button
              onClick={() => onViewChange('invoice-list')}
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
              {invoices.slice(0, 5).map(inv => (
                <div key={inv.id} style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      {inv.customer_name} • Due: {inv.due_date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>${parseFloat(inv.total_amount || 0).toFixed(2)}</div>
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

