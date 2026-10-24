import api from './api';

export const ReportsService = {
  async getMonthly(year) {
    const res = await api.get('/reports/monthly', { params: year ? { year } : {} });
    return res.data.data;
  },

  async getFriendsReport() {
    const res = await api.get('/reports/friends');
    return res.data.data;
  },

  async downloadCsv(type = 'loans', friendId = null) {
    const res = await api.get('/reports/export', {
      params: { type, friendId },
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `miniledger_${type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
