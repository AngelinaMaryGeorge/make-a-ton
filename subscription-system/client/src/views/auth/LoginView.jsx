import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { Lock, Mail, ArrowRight, Sparkles, Zap, ShieldCheck, BarChart3, Users } from 'lucide-react';

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
        } else if (res.role === 'staff' || res.role === 'business') {
          onViewChange('business-dashboard');
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
    } else if (demoRole === 'business') {
      setEmail('staff@brightloop.com');
      setPassword('SecurePass1!');
    } else {
      setEmail('customer@example.com');
      setPassword('SecurePass1!');
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '960px',
        minHeight: '580px',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 32px 80px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
      }}>

        {/* ── Left: Branding Panel ── */}
        <div style={{
          flex: '1 1 40%',
          background: 'linear-gradient(160deg, #1e1b4b 0%, #0d1424 40%, #0a1628 100%)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.07)'
        }}>
          {/* Decorative glow orbs */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-60px',
            width: '240px', height: '240px',
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)',
            filter: 'blur(60px)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-40px',
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: 'rgba(6,182,212,0.12)',
            filter: 'blur(50px)', pointerEvents: 'none'
          }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{
                width: '44px', height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(99,102,241,0.45)'
              }}>
                <Zap size={24} color="#fff" fill="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.375rem', letterSpacing: '-0.03em', color: '#fff' }}>
                  Brightloop
                </div>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#818cf8', textTransform: 'uppercase' }}>
                  Subscriptions
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, color: '#f1f5f9', marginBottom: '0.875rem' }}>
              Billing that runs<br />
              <span className="gradient-text-indigo">on autopilot.</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '260px' }}>
              Unified subscription management — from quotes to renewals, invoicing to analytics.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {[
              { icon: ShieldCheck, text: 'Role-based access control',  color: '#818cf8' },
              { icon: BarChart3,   text: 'Real-time revenue analytics', color: '#34d399' },
              { icon: Users,       text: 'Full customer self-service',  color: '#38bdf8' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '8px',
                  background: `${color}18`,
                  border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} color={color} />
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#cbd5e1', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Login Form ── */}
        <div style={{
          flex: '1 1 60%',
          background: 'rgba(12,20,38,0.97)',
          padding: '3rem 2.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Sign in to your Brightloop workspace
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <Lock size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Account Email
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
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
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }} /> Signing in...</>
              ) : (
                <><span>Sign In</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Demo Fast Login */}
          <div style={{ marginTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem' }}>
            <div style={{
              fontSize: '0.6875rem', fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <Sparkles size={12} color="#818cf8" />
              <span>Quick Demo Login</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { role: 'admin',    label: 'Admin',    sub: 'System Lead',              color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
                { role: 'business', label: 'Staff Login', sub: 'Staff Dashboard',         color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
                { role: 'customer', label: 'Customer', sub: 'Self-Service Portal',       color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)' },
              ].map(({ role, label, sub, color, bg, border }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillQuickDemo(role)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.4rem',
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '0.625rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color }}>{label}</span>
                  <span style={{ fontSize: '0.625rem', color: '#64748b', textAlign: 'center', lineHeight: 1.2 }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <button
              onClick={() => onViewChange('register')}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer' }}
            >
              Create one free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
