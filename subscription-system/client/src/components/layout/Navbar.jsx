import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, ShieldCheck, Zap, ChevronRight } from 'lucide-react';

const VIEW_LABELS = {
  'business-dashboard':   'Business Dashboard',
  'finance-dashboard':    'Finance Dashboard',
  'client-management':    'Client Management',
  'client-subscriptions': 'Client Subscriptions',
  'quotation-editor':     'Quote Builder',
  'quotation-templates':  'Quote Templates',
  'invoice-list':         'Invoice Pipeline',
  'payment-recording':    'Payment Recording',
  'product-catalog':      'Product Catalog',
  'plan-management':      'Plan Management',
  'discount-rules':       'Discount Rules',
  'staff-management':     'Staff Management',
  'customer-dashboard':   'My Portal',
  'my-subscriptions':     'My Subscriptions',
  'my-invoices':          'My Invoices',
};

export const Navbar = ({ currentView, onViewChange }) => {
  const { user, logout, isAdmin, isStaff } = useAuth();

  const handleLogoClick = () => {
    if (!user) { onViewChange('login'); return; }
    onViewChange(user.role === 'customer' ? 'customer-dashboard' : 'business-dashboard');
  };

  const getRoleBadge = (role) => {
    if (role === 'admin')                        return { label: 'Admin',    color: '#818cf8', bg: 'rgba(99,102,241,0.15)' };
    if (role === 'staff' || role === 'business') return { label: 'Business', color: '#34d399', bg: 'rgba(16,185,129,0.12)' };
    return                                              { label: 'Customer', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' };
  };

  const badge = user ? getRoleBadge(user.role) : null;
  const pageLabel = VIEW_LABELS[currentView];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      background: 'rgba(7,11,18,0.85)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 1.25rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>

        {/* Left: Logo + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
          {/* Logo mark */}
          <div
            onClick={handleLogoClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.45)',
              flexShrink: 0
            }}>
              <Zap size={17} color="#fff" fill="#fff" />
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{
                fontSize: '1.0625rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff'
              }}>
                Brightloop
              </span>
              <span style={{
                fontSize: '0.5625rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#6366f1',
                display: 'block',
                textTransform: 'uppercase',
                marginTop: '0.05rem'
              }}>
                Subscriptions
              </span>
            </div>
          </div>

          {/* Breadcrumb separator + page title */}
          {user && pageLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>
                {pageLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right: User info + logout */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f1f5f9' }}>
                  {user.name || user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.1rem' }}>
                  <ShieldCheck size={10} color={badge.color} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: badge.color }}>
                    {badge.label}
                    {user.company ? ` · ${user.company}` : ''}
                  </span>
                </div>
              </div>
              {/* Avatar circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(6,182,212,0.35) 100%)',
                border: '1.5px solid rgba(99,102,241,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 800,
                color: '#c7d2fe',
                flexShrink: 0
              }}>
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Logout */}
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onViewChange('login')}>Log in</button>
            <button className="btn btn-primary btn-sm" onClick={() => onViewChange('register')}>Sign up</button>
          </div>
        )}
      </div>
    </header>
  );
};
