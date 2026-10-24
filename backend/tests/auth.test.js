const request = require('supertest');
const { mockDb } = require('./helpers/mockDb');

// Mock Prisma
jest.mock('../src/config/db', () => mockDb);

const app = require('../src/app');
const { OtpService } = require('../src/services/otp.service');

describe('Auth API - Phone Number and Mock OTP Authentication', () => {
  beforeEach(() => {
    mockDb.reset();
    OtpService._resetStore();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should generate and send OTP for a valid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent successfully');
      expect(res.body.data.expiresInSeconds).toBe(300);

      // Verify OTP is NOT returned in response body
      expect(res.body.otp).toBeUndefined();
      expect(res.body.data.otp).toBeUndefined();

      // Check OTP exists in memory store
      const storedOtp = OtpService._getStoredOtpForTest('9876543210');
      expect(storedOtp).toMatch(/^\d{6}$/);
    });

    it('should reject invalid phone number with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should enforce cooldown if requesting OTP too quickly', async () => {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      // Immediate 2nd request without cooldown
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Please wait');
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP, create user, and return JWT token', async () => {
      // 1. Send OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      const otp = OtpService._getStoredOtpForTest('9876543210');

      // 2. Verify OTP
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '9876543210', otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.phoneNumber).toBe('9876543210');
    });

    it('should reject wrong OTP and report remaining attempts', async () => {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '9876543210', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid OTP. You have 2 attempt(s) remaining.');
    });

    it('should lock out after 3 failed verification attempts', async () => {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      // 3 wrong attempts
      await request(app).post('/api/auth/verify-otp').send({ phoneNumber: '9876543210', otp: '111111' });
      await request(app).post('/api/auth/verify-otp').send({ phoneNumber: '9876543210', otp: '222222' });
      const res3 = await request(app).post('/api/auth/verify-otp').send({ phoneNumber: '9876543210', otp: '333333' });

      expect(res3.status).toBe(400);
      expect(res3.body.message).toContain('Maximum verification attempts exceeded');

      // Attempting again returns no OTP found / expired
      const res4 = await request(app).post('/api/auth/verify-otp').send({ phoneNumber: '9876543210', otp: '123456' });
      expect(res4.status).toBe(400);
    });

    it('should reject expired OTP', async () => {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9876543210' });

      // Simulate time passing by 6 minutes
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phoneNumber: '9876543210', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('The OTP has expired');

      jest.restoreAllMocks();
    });

    it('should create account and register user with name and phone number', async () => {
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phoneNumber: '9888877777', name: 'Vikram Singh', email: 'vikram@example.com' });

      const otp = OtpService._getStoredOtpForTest('9888877777');

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phoneNumber: '9888877777',
          otp,
          name: 'Vikram Singh',
          email: 'vikram@example.com',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.user.name).toBe('Vikram Singh');
      expect(verifyRes.body.data.user.email).toBe('vikram@example.com');
      expect(verifyRes.body.data.token).toBeDefined();
    });
  });
});
