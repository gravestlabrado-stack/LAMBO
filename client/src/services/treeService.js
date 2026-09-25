import api from './api';

export const treeService = {
  async getTrees(params = {}) {
    const response = await api.get('/trees', { params });
    return response.data;
  },

  async getTreeById(id) {
    const response = await api.get(`/trees/${id}`);
    return response.data;
  },

  async getTreeStats() {
    const response = await api.get('/trees/stats');
    return response.data;
  },

  async createTree(treeData) {
    // Support FormData for multipart/form-data photo uploads
    const config = treeData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.post('/trees', treeData, config);
    return response.data;
  },

  async updateTree(id, treeData) {
    const config = treeData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.put(`/trees/${id}`, treeData, config);
    return response.data;
  },

  async deleteTree(id) {
    const response = await api.delete(`/trees/${id}`);
    return response.data;
  },

  async exportTreeLogs(treeId) {
    const response = await api.get(`/trees/${treeId}/export`);
    return response.data;
  },
};

export default treeService;
