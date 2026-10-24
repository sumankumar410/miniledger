import api from './api';

export const PaymentsService = {
  async recordPayment(payload) {
    const res = await api.post('/payments', payload);
    return res.data.data;
  },

  async listPayments(loanId = null) {
    const res = await api.get('/payments', {
      params: loanId ? { loanId } : undefined,
    });
    return res.data.data || [];
  },

  async getPaymentById(id) {
    const res = await api.get(`/payments/${id}`);
    return res.data.data;
  },

  async updatePayment(id, payload) {
    const res = await api.patch(`/payments/${id}`, payload);
    return res.data.data;
  },

  async deletePayment(id) {
    const res = await api.delete(`/payments/${id}`);
    return res.data.data;
  },

  async uploadReceipt(id, file) {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.post(`/payments/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
