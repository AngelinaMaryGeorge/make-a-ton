import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import { UserPlus, ArrowRight, Check, X } from 'lucide-react';

export const RegisterView = ({ onViewChange }) => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password rules validation states
  const hasMinLength = password.length > 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please satisfy all password security criteria before registering.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register({ name, email, company, password });
      if (res.success) {
        login(res.token, res.user);
        onViewChange('customer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(6, 182, 212, 0.4)'
          }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Your Account</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Start your Brightloop subscription experience
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Company Name (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Acme Innovations Ltd"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Work Email
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="alex@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Secure Password
            </label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Strict Validation Checklist */}
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: hasMinLength ? '#10b981' : '#94a3b8' }}>
                {hasMinLength ? <Check size={14} color="#10b981" /> : <X size={14} color="#64748b" />}
                <span>More than 8 characters long</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: hasUpperCase ? '#10b981' : '#94a3b8' }}>
                {hasUpperCase ? <Check size={14} color="#10b981" /> : <X size={14} color="#64748b" />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: hasLowerCase ? '#10b981' : '#94a3b8' }}>
                {hasLowerCase ? <Check size={14} color="#10b981" /> : <X size={14} color="#64748b" />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: hasSpecialChar ? '#10b981' : '#94a3b8' }}>
                {hasSpecialChar ? <Check size={14} color="#10b981" /> : <X size={14} color="#64748b" />}
                <span>At least one special character (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', opacity: isPasswordValid ? 1 : 0.6 }}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <button
            onClick={() => onViewChange('login')}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
