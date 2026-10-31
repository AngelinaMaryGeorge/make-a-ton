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
  Shield
} from 'lucide-react';

export const Sidebar = ({ currentView, onViewChange }) => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  if (!user) return null;

  const adminStaffNav = [
    {
      group: 'Overview',
      items: [
        { id: 'business-dashboard', label: 'Business Dashboard', icon: LayoutDashboard },
        { id: 'finance-dashboard', label: 'Finance Dashboard', icon: BarChart3 }
      ]
    },
    {
      group: 'Clients & Subscriptions',
      items: [
        { id: 'client-management', label: 'Manage Clients', icon: Users },
        { id: 'client-subscriptions', label: 'Client Subscriptions', icon: FolderKanban },
        { id: 'quotation-editor', label: 'Quote Builder & Offers', icon: FileEdit },
        { id: 'quotation-templates', label: 'Quotation Templates', icon: FileText }
      ]
    },
    {
      group: 'Billing & Cashflow',
      items: [
        { id: 'invoice-list', label: 'Invoices Pipeline', icon: Receipt },
        { id: 'payment-recording', label: 'Payment Reconciliation', icon: CreditCard }
      ]
    },
    {
      group: 'Product & Pricing',
      items: [
        { id: 'product-catalog', label: 'Products & Variants', icon: Package, adminOnly: true },
        { id: 'plan-management', label: 'Recurring Plans', icon: Layers, adminOnly: true },
        { id: 'discount-rules', label: 'Discount Rules', icon: Percent, adminOnly: true },
        { id: 'staff-management', label: 'Staff Management', icon: Shield, adminOnly: true }
      ]
    }
  ];

  const customerNav = [
    {
      group: 'Customer Self-Service',
      items: [
        { id: 'customer-dashboard', label: 'Portal Overview', icon: Compass },
        { id: 'my-subscriptions', label: 'My Subscriptions', icon: FolderKanban },
        { id: 'my-invoices', label: 'My Invoices & Receipts', icon: FileCheck }
      ]
    }
  ];

  const navGroups = isCustomer ? customerNav : adminStaffNav;

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      padding: '0 0.75rem 1.5rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx}>
              <div style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b',
                padding: '0 0.6rem 0.4rem 0.6rem'
              }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                        color: isActive ? '#f8fafc' : '#94a3b8',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.8125rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#e2e8f0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      <Icon size={16} color={isActive ? '#818cf8' : '#94a3b8'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
