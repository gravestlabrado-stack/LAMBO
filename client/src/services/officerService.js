import api from './api';

export const officerService = {
  // Fetch full cadet compliance roster
  getRoster: async () => {
    const res = await api.get('/officer/roster');
    return res.data;
  },

  // Fetch drill-down details and observation photos for a specific cadet
  getCadetDetails: async (cadetId) => {
    const res = await api.get(`/officer/cadet/${cadetId}`);
    return res.data;
  },

  // Fetch macro summary metrics across all students and campus wildlings
  getStats: async () => {
    const res = await api.get('/officer/stats');
    return res.data;
  },
};

export default officerService;
