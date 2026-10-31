import apiClient from './client';

export const productService = {
  async getProducts() {
    const res = await apiClient.get('/products');
    return res.data;
  },

  async getProductById(id) {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data) {
    const res = await apiClient.post('/products', data);
    return res.data;
  },

  async addVariant(productId, variantData) {
    const res = await apiClient.post(`/products/${productId}/variants`, variantData);
    return res.data;
  },

  async addPlan(productId, planData) {
    const res = await apiClient.post(`/products/${productId}/plans`, planData);
    return res.data;
  },

  async getPlans() {
    const res = await apiClient.get('/products/plans/all');
    return res.data;
  }
};
