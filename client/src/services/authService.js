import api from './api';

export const authService = {
  async register({ name, rollNumber, password, section }) {
    const response = await api.post('/auth/register', {
      name,
      rollNumber,
      password,
      section,
    });
    return response.data;
  },

  async login({ rollNumber, password }) {
    const response = await api.post('/auth/login', {
      rollNumber,
      password,
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('lambo_token');
    localStorage.removeItem('lambo_user');
  },
};

export default authService;
