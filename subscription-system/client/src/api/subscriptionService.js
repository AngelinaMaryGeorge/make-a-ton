import apiClient from './client';

export const subscriptionService = {
  async getSubscriptions(params = {}) {
    const res = await apiClient.get('/subscriptions', { params });
    return res.data;
  },

  async getMySubscriptions() {
    const res = await apiClient.get('/subscriptions/me');
    return res.data;
  },

  async getSubscriptionById(id) {
    const res = await apiClient.get(`/subscriptions/${id}`);
    return res.data;
  },

  async createSubscription(data) {
    const res = await apiClient.post('/subscriptions', data);
    return res.data;
  },

  async updateStatus(id, status) {
    const res = await apiClient.patch(`/subscriptions/${id}/status`, { status });
    return res.data;
  },

  async renewSubscription(id) {
    const res = await apiClient.post(`/subscriptions/${id}/renew`);
    return res.data;
  },

  // Quotes
  async getQuoteTemplates() {
    const res = await apiClient.get('/quotes/templates');
    return res.data;
  },

  async createQuoteTemplate(data) {
    const res = await apiClient.post('/quotes/templates', data);
    return res.data;
  },

  async getQuotes() {
    const res = await apiClient.get('/quotes');
    return res.data;
  },

  async createQuote(data) {
    const res = await apiClient.post('/quotes', data);
    return res.data;
  },

  async convertQuote(quoteId) {
    const res = await apiClient.post(`/quotes/${quoteId}/convert`);
    return res.data;
  }
};
