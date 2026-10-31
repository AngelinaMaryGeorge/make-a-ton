import apiClient from './client';

export const invoiceService = {
  async getInvoices(params = {}) {
    const res = await apiClient.get('/invoices', { params });
    return res.data;
  },

  async getMyInvoices() {
    const res = await apiClient.get('/invoices/me');
    return res.data;
  },

  async getInvoiceById(id) {
    const res = await apiClient.get(`/invoices/${id}`);
    return res.data;
  },

  async createInvoice(data) {
    const res = await apiClient.post('/invoices', data);
    return res.data;
  },

  async updateStatus(id, status) {
    const res = await apiClient.patch(`/invoices/${id}/status`, { status });
    return res.data;
  },

  async sendInvoice(id) {
    const res = await apiClient.post(`/invoices/${id}/send`);
    return res.data;
  },

  async recordPayment(invoiceId, paymentData) {
    const res = await apiClient.post(`/invoices/${invoiceId}/payments`, paymentData);
    return res.data;
  },

  async runBillingCycle(targetDate = null) {
    const res = await apiClient.post('/invoices/run-billing', { target_date: targetDate });
    return res.data;
  }
};
