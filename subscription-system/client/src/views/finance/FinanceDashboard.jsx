import React, { useState, useEffect } from 'react';
import { reportingService } from '../../api/reportingService';
import { StatCard, StatusBadge, LoadingBlock } from '../../components/common/UIComponents';
import {
  TrendingUp, DollarSign, AlertTriangle, Layers, Zap,
  CheckCircle2, RefreshCw, BarChart3
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

  useEffect(() => { loadMetrics(); }, []);

  return (
    <div style={{ padding: '0 1rem 2rem 0.25rem' }}>

      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title">Finance Dashboard</h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)',
              color: '#34d399', fontSize: '0.6875rem', fontWeight: 700,
              padding: '0.2rem 0.55rem', borderRadius: '9999px'
            }}>
              <Zap size={11} />
              {meta ? `${meta.executionTimeMs}ms` : 'Live'}
            </span>
          </div>
          <p className="page-subtitle">
            MRR/ARR analytics, overdue receivables, and real-time payment feed
          </p>
        </div>
        <button onClick={loadMetrics} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.65s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && !metrics ? (
        <LoadingBlock message="Crunching financial data..." />
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.1rem', marginBottom: '1.75rem' }}>
            <StatCard
              title="Monthly Recurring Revenue"
              value={`$${metrics?.mrr?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`ARR: $${metrics?.arr?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="#6366f1"
              trend="+14.2% from prior period"
              trendUp={true}
            />
            <StatCard
              title="Total Cash Collected"
              value={`$${metrics?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${metrics?.paid_invoices_count || 0} invoices paid`}
              icon={DollarSign}
              color="#10b981"
            />
            <StatCard
              title="Active Subscriptions"
              value={metrics?.active_subscriptions || 0}
              subtitle={`${metrics?.paused_subscriptions || 0} paused · ${metrics?.draft_subscriptions || 0} pending`}
              icon={Layers}
              color="#38bdf8"
            />
            <StatCard
              title="Overdue Receivables"
              value={`$${metrics?.overdue_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${metrics?.overdue_invoices_count || 0} overdue invoices`}
              icon={AlertTriangle}
              color="#ef4444"
              trend={metrics?.overdue_invoices_count > 0 ? 'Requires immediate action' : undefined}
              trendUp={false}
            />
          </div>

          {/* Two-column panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* Overdue Invoices */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5' }}>
                  <AlertTriangle size={16} />
                  Overdue Invoices
                </h3>
                <button onClick={() => onViewChange('invoice-list')} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                  View All ({metrics?.overdue_invoices_count || 0})
                </button>
              </div>

              {metrics?.overdue_invoices?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#34d399' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>All receivables are current</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>No overdue invoices</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {metrics?.overdue_invoices?.map(inv => (
                    <div key={inv.id} style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(239,68,68,0.07)',
                      border: '1px solid rgba(239,68,68,0.18)',
                      borderRadius: '0.5rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f1f5f9' }}>{inv.invoice_number} — {inv.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                          Due: <strong style={{ color: '#f87171' }}>{inv.due_date}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#f87171' }}>${inv.amount_due.toFixed(2)}</div>
                        <button onClick={() => onViewChange('payment-recording')} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.15rem' }}>
                          Record →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Breakdown */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
                <Layers size={16} color="#6366f1" />
                Plans Revenue Contribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metrics?.plan_breakdown?.map((plan, i) => (
                  <div key={i} className="list-item">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f1f5f9' }}>{plan.plan_name}</div>
                      <span className="badge badge-quotation" style={{ marginTop: '0.25rem', textTransform: 'capitalize' }}>{plan.billing_frequency}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.875rem' }}>
                        {plan.count} sub{plan.count !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>${plan.total_value.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Feed */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <DollarSign size={16} color="#10b981" />
              Real-Time Payment Feed
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {metrics?.recent_payments?.map(pay => (
                <div key={pay.id} style={{
                  padding: '0.875rem 1rem',
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.18)',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: '#a5b4fc' }}>
                      {pay.payment_number}
                    </span>
                    <strong style={{ color: '#10b981', fontSize: '0.9375rem' }}>+${pay.amount.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                    {pay.customer_name} ({pay.invoice_number})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                    {pay.method?.replace('_', ' ')} · {new Date(pay.payment_date).toLocaleDateString()}
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
