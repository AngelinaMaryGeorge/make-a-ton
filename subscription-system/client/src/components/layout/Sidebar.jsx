import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Package,
  Layers,
  Percent,
  Users,
  FileText,
  FileEdit,
  Receipt,
  CreditCard,
  Compass,
  FolderKanban,
  FileCheck,
  LayoutDashboard,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ currentView, onViewChange }) => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  if (!user) return null;

  const adminStaffNav = [
    {
      group: 'Overview',
      items: [
        { id: 'business-dashboard', label: 'Business Dashboard', icon: LayoutDashboard },
        { id: 'finance-dashboard',  label: 'Finance Dashboard',  icon: BarChart3 }
      ]
    },
    {
      group: 'Clients & Subscriptions',
      items: [
        { id: 'client-management',    label: 'Manage Clients',      icon: Users },
        { id: 'client-subscriptions', label: 'Client Subscriptions', icon: FolderKanban },
        { id: 'quotation-editor',     label: 'Quote Builder',        icon: FileEdit },
        { id: 'quotation-templates',  label: 'Quote Templates',      icon: FileText }
      ]
    },
    {
      group: 'Billing & Cashflow',
      items: [
        { id: 'invoice-list',       label: 'Invoice Pipeline',      icon: Receipt },
        { id: 'payment-recording',  label: 'Payment Reconciliation', icon: CreditCard }
      ]
    },
    {
      group: 'Product & Pricing',
      items: [
        { id: 'product-catalog',  label: 'Products & Variants', icon: Package,  adminOnly: true },
        { id: 'plan-management',  label: 'Recurring Plans',     icon: Layers,   adminOnly: true },
        { id: 'discount-rules',   label: 'Discount Rules',      icon: Percent,  adminOnly: true },
        { id: 'staff-management', label: 'Staff Management',    icon: Shield,   adminOnly: true }
      ]
    }
  ];

  const customerNav = [
    {
      group: 'My Account',
      items: [
        { id: 'customer-dashboard', label: 'Portal Overview',        icon: Compass },
        { id: 'my-subscriptions',   label: 'My Subscriptions',       icon: FolderKanban },
        { id: 'my-invoices',        label: 'Invoices & Receipts',    icon: FileCheck }
      ]
    }
  ];

  const navGroups = isCustomer ? customerNav : adminStaffNav;

  const getRoleLabel = (role) => {
    if (role === 'admin')                       return 'System Admin';
    if (role === 'staff' || role === 'business') return 'Business Account';
    return 'Customer';
  };

  const getRoleColor = (role) => {
    if (role === 'admin')  return '#818cf8';
    if (role === 'staff' || role === 'business') return '#34d399';
    return '#38bdf8';
  };

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside style={{
      width: '256px',
      minWidth: '256px',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 0.625rem 1.25rem 1rem',
      gap: '0.5rem',
    }}>

      {/* Navigation groups */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflow: 'hidden auto'
        }}
      >
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx}>
              <div style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                color: '#475569',
                padding: '0 0.5rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                <span>{group.group}</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.06) 100%)'
                          : 'transparent',
                        color: isActive ? '#e0e7ff' : '#64748b',
                        fontFamily: 'var(--font-main)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderLeft: isActive
                          ? '2px solid #6366f1'
                          : '2px solid transparent',
                        position: 'relative'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = '#cbd5e1';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#64748b';
                        }
                      }}
                    >
                      <Icon
                        size={15}
                        style={{
                          color: isActive ? '#818cf8' : 'currentColor',
                          flexShrink: 0
                        }}
                      />
                      <span style={{ flex: 1, lineHeight: 1.2 }}>{item.label}</span>
                      {isActive && (
                        <ChevronRight size={12} style={{ color: '#6366f1', flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Card */}
      <div
        className="glass-panel"
        style={{
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderColor: 'rgba(255,255,255,0.08)'
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.75rem',
          flexShrink: 0,
          letterSpacing: '0.02em'
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#f1f5f9',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.name || user.email}
          </div>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: getRoleColor(user.role),
            marginTop: '0.1rem'
          }}>
            {getRoleLabel(user.role)}
          </div>
        </div>
      </div>
    </aside>
  );
};
