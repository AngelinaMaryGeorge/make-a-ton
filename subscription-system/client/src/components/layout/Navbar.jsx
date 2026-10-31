import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck, Zap } from 'lucide-react';

export const Navbar = ({ currentView, onViewChange }) => {
  const { user, logout, isAdmin, isStaff } = useAuth();

  const handleLogoClick = () => {
    if (!user) {
      onViewChange('login');
      return;
    }
    if (user.role === 'customer') {
      onViewChange('customer-dashboard');
    } else {
      onViewChange('business-dashboard');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'staff' || role === 'business') return 'Business Account';
    if (role === 'admin') return 'System Admin';
    return 'Customer';
  };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: '0.75rem',
      zIndex: 100,
      margin: '0.75rem 1.25rem',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Brand logo & tagline */}
      <div 
        onClick={handleLogoClick}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Zap size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Brightloop
            </span>
            <span style={{ fontSize: '0.6875rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
              SUBSCRIPTIONS
            </span>
          </div>
        </div>
      </div>

      {/* User profile & actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user.name || user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <ShieldCheck size={12} color="#6366f1" />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {getRoleBadge(user.role)} {user.company ? `• ${user.company}` : ''}
                  </span>
                </div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <User size={18} />
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => onViewChange('login')}>
              Log In
            </button>
            <button className="btn btn-primary" onClick={() => onViewChange('register')}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
