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

  async createTree(treeData) {
    const response = await api.post('/trees', treeData);
    return response.data;
  },

  async updateTree(id, treeData) {
    const response = await api.put(`/trees/${id}`, treeData);
    return response.data;
  },

  async deleteTree(id) {
    const response = await api.delete(`/trees/${id}`);
    return response.data;
  },
};

export default treeService;
