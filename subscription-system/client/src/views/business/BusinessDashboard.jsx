import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { subscriptionService } from '../../api/subscriptionService';
import { invoiceService } from '../../api/invoiceService';
import { StatCard, StatusBadge, LoadingBlock, EmptyState } from '../../components/common/UIComponents';
import { Users, FolderKanban, Receipt, CreditCard, ArrowRight, PlusCircle } from 'lucide-react';

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
        if (subsRes.success)    setSubscriptions(subsRes.subscriptions || []);
        if (invRes.success)     setInvoices(invRes.invoices || []);
      } catch (err) {
        console.error('Error loading business dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const activeSubs       = subscriptions.filter(s => s.status === 'Active');
  const unpaidInvoices   = invoices.filter(i => i.status !== 'Paid');
  const totalReceivables = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount_due || i.total_amount) || 0), 0);
  const totalCollected   = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0);

  const quickActions = [
    {
      id: 'client-management',
      icon: Users,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.13)',
      title: 'Client Management',
      desc: 'Onboard and manage corporate client profiles, contacts, and services.'
    },
    {
      id: 'client-subscriptions',
      icon: FolderKanban,
      color: '#34d399',
      bg: 'rgba(16,185,129,0.13)',
      title: 'Client Subscriptions',
      desc: 'Provision, pause, resume, or renew recurring plans across clients.'
    },
    {
      id: 'quotation-editor',
      icon: PlusCircle,
      color: '#a5b4fc',
      bg: 'rgba(99,102,241,0.13)',
      title: 'Quote Builder',
      desc: 'Draft enterprise proposals with Odoo variant modifiers and 1-click conversion.'
    },
    {
      id: 'invoice-list',
      icon: Receipt,
      color: '#fbbf24',
      bg: 'rgba(245,158,11,0.13)',
      title: 'Invoices & Billing',
      desc: 'Review the automated invoice pipeline and trigger Billing Day runs.'
    },
  ];

  return (
    <div style={{ padding: '0 1rem 2rem 0.25rem' }}>

      {/* Hero Banner */}
      <div className="hero-banner animate-fade-in-up" style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-quotation" style={{ marginBottom: '0.6rem' }}>Business Workspace</span>
          <h1 className="page-title" style={{ marginTop: '0.1rem' }}>
            Business &amp; Client Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Welcome back, <strong style={{ color: '#fff' }}>{user?.name}</strong>
            {' '}— manage clients, subscriptions, and billing cashflow.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => onViewChange('client-management')} className="btn btn-secondary">
            <Users size={15} /><span>Clients</span>
          </button>
          <button onClick={() => onViewChange('client-subscriptions')} className="btn btn-primary">
            <PlusCircle size={15} /><span>Subscriptions</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingBlock message="Loading dashboard data..." />
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.1rem', marginBottom: '1.75rem' }}>
            <StatCard title="Total Clients" value={clients.length} subtitle="Corporate accounts" icon={Users} color="#38bdf8" />
            <StatCard title="Active Subscriptions" value={activeSubs.length} subtitle={`${subscriptions.length} total`} icon={FolderKanban} color="#10b981" />
            <StatCard title="Outstanding Receivables" value={`$${totalReceivables.toFixed(2)}`} subtitle={`${unpaidInvoices.length} pending invoices`} icon={Receipt} color="#f59e0b" />
            <StatCard title="Revenue Reconciled" value={`$${totalCollected.toFixed(2)}`} subtitle="Settled in full" icon={CreditCard} color="#818cf8" />
          </div>

          {/* Quick Action Cards */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', fontSize: '0.75rem' }}>
              Operations Hub
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {quickActions.map(item => (
                <div
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="glass-panel action-card animate-fade-in-up"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="action-card-icon" style={{ background: item.bg, color: item.color }}>
                      <item.icon size={20} />
                    </div>
                    <ArrowRight size={15} color="#475569" />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.35rem' }}>{item.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
            {/* Subscriptions */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Subscriptions</h3>
                <button onClick={() => onViewChange('client-subscriptions')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  View All <ArrowRight size={13} />
                </button>
              </div>
              {subscriptions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No subscriptions yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {subscriptions.slice(0, 5).map(s => (
                    <div key={s.id} className="list-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>{s.subscription_number}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {s.customer_name} · {s.plan_name}
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Invoices</h3>
                <button onClick={() => onViewChange('invoice-list')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  View All <ArrowRight size={13} />
                </button>
              </div>
              {invoices.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No invoices yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {invoices.slice(0, 5).map(inv => (
                    <div key={inv.id} className="list-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>{inv.invoice_number}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {inv.customer_name} · Due: {inv.due_date}
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
