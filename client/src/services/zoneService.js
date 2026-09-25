import api from './api';

export const zoneService = {
  async getZones() {
    const response = await api.get('/zones');
    return response.data;
  },

  async createZone({ name, description }) {
    const response = await api.post('/zones', { name, description });
    return response.data;
  },
};

export default zoneService;
