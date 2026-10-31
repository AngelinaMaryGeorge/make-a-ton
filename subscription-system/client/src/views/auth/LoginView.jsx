import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginView = ({ onViewChange }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.success) {
        login(res.token, res.user);
        if (res.role === 'customer') {
          onViewChange('customer-dashboard');
        } else {
          onViewChange('finance-dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@brightloop.com');
      setPassword('AdminPass1!');
    } else if (demoRole === 'staff') {
      setEmail('staff@brightloop.com');
      setPassword('SecurePass1!');
    } else {
      setEmail('customer@example.com');
      setPassword('SecurePass1!');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Sign in to access Brightloop Subscription Core
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => onViewChange('forgot-password')}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Fast Hackathon Demo Logins</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin')}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('staff')}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('customer')}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
            >
              Customer
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onViewChange('register')}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};
