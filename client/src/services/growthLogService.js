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

  async getLogById(id) {
    const response = await api.get(`/growth-logs/${id}`);
    return response.data;
  },

  async createLog(formData) {
    const isFormData = formData instanceof FormData;
    const response = await api.post('/growth-logs', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  async updateLog(id, formData) {
    const isFormData = formData instanceof FormData;
    const response = await api.put(`/growth-logs/${id}`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  async deleteLog(id) {
    const response = await api.delete(`/growth-logs/${id}`);
    return response.data;
  },

  async exportTreeLogs(treeId) {
    const response = await api.get(`/growth-logs/export/${treeId}`);
    return response.data;
  },
};

export default growthLogService;
