import api from './api';

export const NotificationsService = {
  async listNotifications() {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data.data;
  },
};
