import React, { useState, useEffect } from 'react';
import { authService } from '../../api/authService';

export const StaffManagementView = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Internal Staff Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            View internal customer success and sales staff accounts
          </p>
        </div>
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

    </div>
  );
};
