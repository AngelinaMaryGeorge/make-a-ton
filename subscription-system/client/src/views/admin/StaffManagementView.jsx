import React, { useState, useEffect } from 'react';
import { authService } from '../../api/authService';
import { Modal } from '../../components/common/UIComponents';
import { Users, UserPlus, Shield, Mail, Building, CheckCircle2 } from 'lucide-react';

export const StaffManagementView = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    company: 'Brightloop Internal',
    role: 'staff'
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await authService.getStaff();
      if (res.success) {
        setStaffList(res.staff);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.register(newStaff);
      if (res.success) {
        setIsAddStaffOpen(false);
        setNewStaff({ name: '', email: '', password: '', company: 'Brightloop Internal', role: 'staff' });
        loadStaff();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating staff account');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Internal Staff Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Only administrators can authorize and provision internal customer success and sales staff accounts
          </p>
        </div>
        <button onClick={() => setIsAddStaffOpen(true)} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add Internal Staff Member</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading staff members...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Staff Name</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Work Email</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Role & Permissions</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600 }}>Provisioned</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#f8fafc' }}>
                    {staff.name}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                    {staff.email}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="badge badge-quotation" style={{ textTransform: 'uppercase' }}>
                      {staff.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8' }}>
                    {staff.company || 'Customer Operations'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8125rem' }}>
                    {new Date(staff.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Staff */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Provision Internal Staff Member"
      >
        <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Staff Full Name
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Rachel Adams"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Corporate Email (@brightloop.com)
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="rachel@brightloop.com"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Initial Password (&gt;8 chars, uppercase, lowercase, special char)
            </label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="StaffPass1!"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddStaffOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Authorize & Create Staff
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
