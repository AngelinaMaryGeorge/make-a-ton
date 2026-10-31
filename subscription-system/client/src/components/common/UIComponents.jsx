import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

/* ──────────────────────────────────────────────
   Modal
────────────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children, maxWidth = '650px' }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2,6,16,0.80)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.18s ease'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-panel animate-scale-in"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(12,20,38,0.98)',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   StatCard
────────────────────────────────────────────── */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#6366f1',
  trend = null,
  trendUp = true
}) => {
  return (
    <div
      className="glass-panel glass-card-interactive stat-card animate-fade-in-up"
      style={{ '--stat-color': color }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kpi-label">{title}</div>
          <div className="kpi-value" style={{ marginTop: '0.5rem' }}>{value}</div>
          {subtitle && (
            <div className="kpi-sub">{subtitle}</div>
          )}
          {trend && (
            <div
              className={`kpi-trend ${trendUp ? 'up' : 'down'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.6rem' }}
            >
              {trendUp
                ? <TrendingUp size={13} />
                : <TrendingDown size={13} />
              }
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            padding: '0.8rem',
            borderRadius: '0.75rem',
            backgroundColor: `${color}18`,
            color: color,
            border: `1px solid ${color}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '1rem'
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   StatusBadge
────────────────────────────────────────────── */
export const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();
  let cls = 'badge-draft';
  if (['active', 'paid'].includes(norm))                       cls = 'badge-active';
  else if (['quotation', 'confirmed', 'sent'].includes(norm))  cls = 'badge-quotation';
  else if (['paused'].includes(norm))                          cls = 'badge-paused';
  else if (['closed', 'cancelled', 'expired'].includes(norm))  cls = 'badge-closed';

  return <span className={`badge ${cls}`}>{status}</span>;
};

/* ──────────────────────────────────────────────
   LoadingBlock
────────────────────────────────────────────── */
export const LoadingBlock = ({ message = 'Loading...' }) => (
  <div className="loading-block">
    <div className="spinner" />
    <span>{message}</span>
  </div>
);

/* ──────────────────────────────────────────────
   EmptyState
────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state">
    {Icon && (
      <div className="empty-state-icon">
        <Icon size={44} />
      </div>
    )}
    <h3>{title}</h3>
    {description && <p style={{ marginTop: '0.4rem' }}>{description}</p>}
    {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
  </div>
);

/* ──────────────────────────────────────────────
   SectionPanel — glass card with header
────────────────────────────────────────────── */
export const SectionPanel = ({ title, icon: Icon, iconColor = '#6366f1', action, children, className = '' }) => (
  <div className={`glass-panel ${className}`} style={{ padding: '1.5rem' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.25rem'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {Icon && <Icon size={17} color={iconColor} />}
        <span>{title}</span>
      </h3>
      {action}
    </div>
    {children}
  </div>
);

/* ──────────────────────────────────────────────
   ListRow — standardized list item
────────────────────────────────────────────── */
export const ListRow = ({ left, right, onClick }) => (
  <div
    className="list-item"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
    {right && (
      <div style={{ flexShrink: 0, marginLeft: '1rem', textAlign: 'right' }}>{right}</div>
    )}
  </div>
);

/* ──────────────────────────────────────────────
   FormField — label + input wrapper
────────────────────────────────────────────── */
export const FormField = ({ label, hint, required, children }) => (
  <div>
    {label && (
      <label style={{
        display: 'block',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#cbd5e1',
        marginBottom: '0.4rem'
      }}>
        {label}
        {required && <span style={{ color: '#f87171', marginLeft: '0.2rem' }}>*</span>}
      </label>
    )}
    {children}
    {hint && (
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{hint}</p>
    )}
  </div>
);
