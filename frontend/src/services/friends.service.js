import api from './api';

export const FriendsService = {
  async listFriends() {
    const res = await api.get('/friends');
    return res.data.data || [];
  },

  async createFriend(payload) {
    const res = await api.post('/friends', payload);
    return res.data.data;
  },

  async getFriendById(id) {
    const res = await api.get(`/friends/${id}`);
    return res.data.data;
  },

  async updateFriend(id, payload) {
    const res = await api.patch(`/friends/${id}`, payload);
    return res.data.data;
  },

  async deleteFriend(id) {
    const res = await api.delete(`/friends/${id}`);
    return res.data.data;
  },

  async getFriendSummary(id) {
    const res = await api.get(`/friends/${id}/summary`);
    return res.data.data;
  },

  async getFriendStatement(id) {
    const res = await api.get(`/friends/${id}/statement`);
    return res.data.data;
  },
};
