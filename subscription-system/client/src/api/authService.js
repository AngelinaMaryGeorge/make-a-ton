import apiClient from './client';

export const authService = {
  async register(data) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(credentials) {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token, newPassword) {
    const res = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async getStaff() {
    const res = await apiClient.get('/auth/staff');
    return res.data;
  },

  async createStaff(data) {
    const res = await apiClient.post('/auth/staff', data);
    return res.data;
  }
};
