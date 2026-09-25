import api from './api';

export const growthLogService = {
  async getLogs(params = {}) {
    const response = await api.get('/growth-logs', { params });
    return response.data;
  },

  async getTreeLogs(treeId) {
    const response = await api.get(`/growth-logs?tree=${treeId}`);
    return response.data;
  },

  async createLog(formData) {
    // If formData is FormData instance (for image upload), let Axios set Content-Type
    const response = await api.post('/growth-logs', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  async deleteLog(id) {
    const response = await api.delete(`/growth-logs/${id}`);
    return response.data;
  },
};

export default growthLogService;
