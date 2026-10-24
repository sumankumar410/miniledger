import api from './api';

export const LoanService = {
  async getSummary() {
    const response = await api.get('/loans/summary');
    return response.data.data;
  },

  async getLoans(params = {}) {
    const response = await api.get('/loans', { params });
    return {
      loans: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getLoanById(id) {
    const response = await api.get(`/loans/${id}`);
    return response.data.data;
  },

  async createLoan(payload) {
    const response = await api.post('/loans', payload);
    return response.data.data;
  },

  async updateLoan(id, payload) {
    const response = await api.patch(`/loans/${id}`, payload);
    return response.data.data;
  },

  async repayLoan(id) {
    const response = await api.patch(`/loans/${id}/repay`);
    return response.data.data;
  },

  async getLoanSummary(id) {
    const response = await api.get(`/loans/${id}/summary`);
    return response.data.data;
  },

  async getLoanPayments(id) {
    const response = await api.get(`/loans/${id}/payments`);
    return response.data.data;
  },

  async createLoanPayment(id, payload) {
    const response = await api.post(`/loans/${id}/payments`, payload);
    return response.data.data;
  },
};

export const LoansService = LoanService;
export default LoanService;
