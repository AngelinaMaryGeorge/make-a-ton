import apiClient from './client';

export const reportingService = {
  async getDashboardMetrics() {
    const res = await apiClient.get('/reports/dashboard');
    return res.data;
  },

  async getDiscounts() {
    const res = await apiClient.get('/discounts');
    return res.data;
  },

  async createDiscount(data) {
    const res = await apiClient.post('/discounts', data);
    return res.data;
  }
};
