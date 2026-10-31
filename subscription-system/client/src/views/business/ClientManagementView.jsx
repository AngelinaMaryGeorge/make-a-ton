import React, { useState, useEffect } from 'react';
import { authService } from '../../api/authService';
import { Modal } from '../../components/common/UIComponents';
import { Users, UserPlus, Mail, Phone, Building, Search, PlusCircle, FolderKanban, Receipt, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ClientManagementView = ({ onViewChange, onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: 'SecurePass1!'
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await authService.getClients();
      if (res.success) {
        setClients(res.clients || []);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
      setErrorMessage(err.response?.data?.message || 'Unable to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await authService.createClient(newClient);
      if (res.success) {
        setIsAddClientOpen(false);
        setNewClient({
          name: '',
          email: '',
          company: '',
          phone: '',
          password: 'SecurePass1!'
        });
        setSuccessMessage(`Client account for ${res.client?.name || 'new client'} created successfully.`);
        await loadClients();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error creating client account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.company && c.company.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Client Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Onboard new clients, manage client accounts, and track client subscriptions and billing history
          </p>
        </div>
        <button onClick={() => setIsAddClientOpen(true)} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Onboard New Client</span>
        </button>
      </div>

      {successMessage && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '1.5rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search clients by name, corporate email, or company name..."
          className="form-input"
          style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '0.4rem 0' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No clients found</h3>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0', fontSize: '0.875rem' }}>
            {searchTerm ? 'No clients match your search query.' : 'Onboard your first client to start creating quotations and managing subscriptions.'}
          </p>
          <button onClick={() => setIsAddClientOpen(true)} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <UserPlus size={16} />
            <span>Onboard Client</span>
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Client & Contact</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Company</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Active Subscriptions</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Total Invoiced</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Member Since</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <Mail size={12} /> {client.email}
                    </div>
                    {client.phone && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                        <Phone size={12} /> {client.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building size={14} color="#818cf8" />
                      <span>{client.company || 'Direct Account'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="badge badge-active">
                      {client.active_subscriptions_count || 0} active
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.4rem' }}>
                      ({client.subscriptions_count || 0} total)
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                    ${parseFloat(client.total_billed || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8125rem' }}>
                    {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          if (onViewChange) onViewChange('client-subscriptions');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                        title="View client subscriptions"
                      >
                        <FolderKanban size={13} />
                        <span>Subscriptions</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onViewChange) onViewChange('quotation-editor');
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                        title="Create quote for client"
                      >
                        <PlusCircle size={13} />
                        <span>New Quote</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Onboard Client */}
      <Modal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        title="Onboard New Client Account"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Client Full Name / Primary Contact *
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Johnathan Miller"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Corporate Email Address *
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="john@enterprisecorp.com"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Company / Organization Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enterprise Corp Inc"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Phone Number
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 (555) 019-2834"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Initial Password (&gt;8 chars, uppercase, lowercase, special char)
            </label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="SecurePass1!"
              value={newClient.password}
              onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Default: SecurePass1! (Client can reset anytime using the Forgot Password flow)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddClientOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Onboarding...' : 'Onboard Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

