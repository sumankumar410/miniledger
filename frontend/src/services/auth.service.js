import api from './api';

export const AuthService = {
  /**
   * Request 6-digit OTP for a phone number (with optional name/email for registration)
   */
  async sendOtp(phoneNumber, name = null, email = null) {
    const payload = { phoneNumber };
    if (name) payload.name = name;
    if (email) payload.email = email;

    const response = await api.post('/auth/send-otp', payload);
    return response.data.data;
  },

  /**
   * Verify the OTP and obtain JWT authentication token
   */
  async verifyOtp(phoneNumber, otp, name = null, email = null) {
    const payload = { phoneNumber, otp };
    if (name) payload.name = name;
    if (email) payload.email = email;

    const response = await api.post('/auth/verify-otp', payload);
    return response.data.data;
  },
};
