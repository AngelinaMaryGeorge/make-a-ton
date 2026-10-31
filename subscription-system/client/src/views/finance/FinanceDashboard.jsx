import React, { useState, useEffect } from 'react';
import { reportingService } from '../../api/reportingService';
import { StatCard, StatusBadge } from '../../components/common/UIComponents';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Users, 
  ArrowUpRight, 
  Layers, 
  Zap, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

export const FinanceDashboard = ({ onViewChange }) => {
  const [metrics, setMetrics] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await reportingService.getDashboardMetrics();
      if (res.success) {
        setMetrics(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error loading finance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div style={{ padding: '0 1rem 2.5rem 1rem' }}>
      {/* Header with High-Performance SLA Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Finance Executive Dashboard</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px'
            }}>
              <Zap size={12} />
              {meta ? `${meta.executionTimeMs}ms Response (SLA <2s)` : 'Sub-Second SLA'}
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Month-end financial metrics, recurring revenue analytics, and aging overdue receivables
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="btn btn-secondary"
          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.85rem' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Financials</span>
        </button>
      </div>

      {loading && !metrics ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Crunching financial summary...
        </div>
      ) : (
        <>
          {/* Top KPI Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <StatCard
              title="Monthly Recurring Revenue (MRR)"
              value={`$${metrics?.mrr?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`ARR Run-Rate: $${metrics?.arr?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="#6366f1"
              trend="+14.2% from prior period"
            />
            <StatCard
              title="Total Cash Collected"
              value={`$${metrics?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${metrics?.paid_invoices_count || 0} invoices paid in full`}
              icon={DollarSign}
              color="#10b981"
            />
            <StatCard
              title="Active Recurring Subscriptions"
              value={metrics?.active_subscriptions || 0}
              subtitle={`${metrics?.paused_subscriptions || 0} paused • ${metrics?.draft_subscriptions || 0} pending`}
              icon={Layers}
              color="#38bdf8"
            />
            <StatCard
              title="Overdue Receivables"
              value={`$${metrics?.overdue_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${metrics?.overdue_invoices_count || 0} invoices past payment terms`}
              icon={AlertTriangle}
              color="#ef4444"
            />
          </div>

          {/* Plan Breakdown & Aging Overdue Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
            {/* Overdue Receivables Chasing Box */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                  <AlertTriangle size={18} />
                  <span>Action Required: Overdue Invoices</span>
                </h3>
                <button
                  onClick={() => onViewChange('invoice-list')}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  View All ({metrics?.overdue_invoices_count || 0})
                </button>
              </div>

              {metrics?.overdue_invoices?.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>No overdue invoices! Receivables are healthy.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {metrics?.overdue_invoices?.map((inv) => (
                    <div key={inv.id} style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {inv.invoice_number} — {inv.customer_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                          Company: {inv.customer_company || 'Direct'} • Due: <strong style={{ color: '#f87171' }}>{inv.due_date}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#f87171', fontSize: '1rem' }}>
                          ${inv.amount_due.toFixed(2)}
                        </div>
                        <button
                          onClick={() => onViewChange('payment-recording')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '0.2rem'
                          }}
                        >
                          Record Payment →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Distribution Breakdown */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#6366f1" />
                <span>Active Plans Revenue Contribution</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {metrics?.plan_breakdown?.map((plan, i) => (
                  <div key={i} style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{plan.plan_name}</div>
                      <span className="badge badge-quotation" style={{ marginTop: '0.25rem', textTransform: 'capitalize' }}>
                        {plan.billing_frequency}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#34d399' }}>
                        {plan.count} subscription{plan.count === 1 ? '' : 's'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Base: ${plan.total_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Cash Inflows Feed */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="#10b981" />
              <span>Real-Time Payment Feed</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {metrics?.recent_payments?.map((pay) => (
                <div key={pay.id} style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: '#a5b4fc' }}>
                      {pay.payment_number}
                    </span>
                    <strong style={{ color: '#10b981', fontSize: '0.9375rem' }}>+${pay.amount.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                    {pay.customer_name} ({pay.invoice_number})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                    {pay.method?.replace('_', ' ')} • {new Date(pay.payment_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
