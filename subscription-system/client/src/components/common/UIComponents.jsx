import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '650px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, subtitle, icon: Icon, color = '#6366f1', trend = null }) => {
  return (
    <div className="glass-panel glass-card-interactive" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem', letterSpacing: '-0.03em' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem' }}>
              {subtitle}
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: `${color}1a`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}33`
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
          {trend}
        </div>
      )}
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();
  let badgeClass = 'badge-draft';
  if (['active', 'paid'].includes(norm)) badgeClass = 'badge-active';
  else if (['quotation', 'confirmed', 'sent'].includes(norm)) badgeClass = 'badge-quotation';
  else if (['paused'].includes(norm)) badgeClass = 'badge-paused';
  else if (['closed', 'cancelled', 'expired'].includes(norm)) badgeClass = 'badge-closed';

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
