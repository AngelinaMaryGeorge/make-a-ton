import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#6366f1', fontSize: '1rem', fontWeight: 600 }}>Loading Brightloop platform...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Authentication Required</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Please log in to access this portal.</p>
        <button className="btn btn-primary" onClick={() => window.location.hash = '#/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>Access Restricted</h2>
        <p style={{ color: '#94a3b8' }}>
          Your account role (<span style={{ fontWeight: 700, color: '#f8fafc' }}>{user.role}</span>) does not have permission to view this section.
        </p>
      </div>
    );
  }

  return children;
};
