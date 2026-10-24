import api from './api';

export const RemindersService = {
  async getReminders() {
    const res = await api.get('/reminders');
    return res.data.data || {
      overdue: [],
      dueToday: [],
      dueTomorrow: [],
      dueWithin7Days: [],
      upcomingThisMonth: [],
      noDueDate: [],
    };
  },

  async listScheduled() {
    const res = await api.get('/reminders/scheduled');
    return res.data.data || [];
  },

  async createReminder(payload) {
    const res = await api.post('/reminders', payload);
    return res.data.data;
  },

  async updateReminder(id, payload) {
    const res = await api.patch(`/reminders/${id}`, payload);
    return res.data.data;
  },

  async deleteReminder(id) {
    const res = await api.delete(`/reminders/${id}`);
    return res.data.data;
  },
};
