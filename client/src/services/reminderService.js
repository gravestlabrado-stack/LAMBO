import api from './api';

const reminderService = {
  /**
   * Get all reminders (optionally filtered by treeId)
   */
  async getReminders(treeId) {
    const params = treeId ? { tree: treeId } : {};
    const res = await api.get('/reminders', { params });
    return res.data;
  },

  /**
   * Create a new reminder
   */
  async createReminder(reminderData) {
    const res = await api.post('/reminders', reminderData);
    return res.data;
  },

  /**
   * Update a reminder (toggle completed or edit details)
   */
  async updateReminder(id, updateData) {
    const res = await api.put(`/reminders/${id}`, updateData);
    return res.data;
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(id) {
    const res = await api.delete(`/reminders/${id}`);
    return res.data;
  },

  /**
   * Register push subscription on the backend
   */
  async subscribePush(subscription) {
    const res = await api.post('/reminders/subscribe', { subscription });
    return res.data;
  },

  /**
   * Dispatch a test push notification to user's devices
   */
  async sendTestPush() {
    const res = await api.post('/reminders/test-push');
    return res.data;
  },

  /**
   * Trigger check for due reminders
   */
  async triggerDueCheck() {
    const res = await api.post('/reminders/trigger-check');
    return res.data;
  },
};

export default reminderService;
