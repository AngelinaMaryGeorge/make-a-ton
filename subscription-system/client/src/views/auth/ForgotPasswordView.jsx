import React, { useState } from 'react';
import { authService } from '../../api/authService';
import { KeyRound, ArrowLeft, Mail, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ForgotPasswordView = ({ onViewChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setResetSent(true);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      if (res.success) {
        setResetSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <button
          onClick={() => onViewChange('login')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)'
          }}>
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Password Recovery</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter your registered email to receive a secure password reset link
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

        {!resetSent ? (
          <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Account Email
              </label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="registered@brightloop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? 'Generating Link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : !resetSuccess ? (
          <div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                A secure reset token was created for <span style={{ fontWeight: 700, color: '#fff' }}>{email}</span>.
              </div>
            </div>

            <form onSubmit={handleApplyReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Reset Token (Pre-filled for Hackathon)
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  New Secure Password (&gt;8 chars, upper, lower, special)
                </label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="NewSecurePass1!"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Password Updated!</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              Your password has been reset securely. You can now log into your account.
            </p>
            <button className="btn btn-primary" onClick={() => onViewChange('login')} style={{ width: '100%' }}>
              Proceed to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
