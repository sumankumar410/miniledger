const request = require('supertest');
const jwt = require('jsonwebtoken');
const { mockDb } = require('./helpers/mockDb');

// Mock Prisma
jest.mock('../src/config/db', () => mockDb);

const app = require('../src/app');
const { env } = require('../src/config/env');

describe('Loan Management APIs & Financial Calculations', () => {
  let user1, token1;
  let user2, token2;

  beforeEach(async () => {
    mockDb.reset();
    jest.clearAllMocks();

    // Create User 1
    user1 = await mockDb.user.upsert({
      where: { phoneNumber: '9876543210' },
      create: { phoneNumber: '9876543210' },
    });
    token1 = jwt.sign({ userId: user1.id, phoneNumber: user1.phoneNumber }, env.JWT_SECRET);

    // Create User 2
    user2 = await mockDb.user.upsert({
      where: { phoneNumber: '9123456780' },
      create: { phoneNumber: '9123456780' },
    });
    token2 = jwt.sign({ userId: user2.id, phoneNumber: user2.phoneNumber }, env.JWT_SECRET);
  });

  describe('Authentication & Authorization Guards', () => {
    it('should reject requests without Authorization header with 401', async () => {
      const res = await request(app).get('/api/loans');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token missing');
    });

    it('should reject requests with invalid JWT token with 401', async () => {
      const res = await request(app)
        .get('/api/loans')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/loans - Create Loan', () => {
    it('should create a loan successfully for authenticated user', async () => {
      const payload = {
        friendName: 'Rohan Sharma',
        amount: 2500.5,
        dueDate: '2026-12-01',
      };

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.friendName).toBe('Rohan Sharma');
      expect(res.body.data.amount).toBe('2500.50');
      expect(res.body.data.isRepaid).toBe(false);
      expect(res.body.data.userId).toBe(user1.id);
    });

    it('should reject loan with zero or negative amount', async () => {
      const resZero = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Amit',
          amount: 0,
          dueDate: '2026-12-01',
        });
      expect(resZero.status).toBe(400);

      const resNeg = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Amit',
          amount: -150,
          dueDate: '2026-12-01',
        });
      expect(resNeg.status).toBe(400);
      expect(resNeg.body.message).toBe('Validation failed');
    });

    it('should reject loan with empty friendName or invalid date', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: '',
          amount: 500,
          dueDate: 'not-a-valid-date',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('User Ownership Isolation & Loan Retrieval', () => {
    it('should never allow User 2 to access User 1 loan', async () => {
      // User 1 creates a loan
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Priya',
          amount: 1000,
          dueDate: '2026-12-15',
        });
      const loanId = createRes.body.data.id;

      // User 1 can access it
      const resUser1 = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(resUser1.status).toBe(200);
      expect(resUser1.body.data.friendName).toBe('Priya');

      // User 2 cannot access it (returns 404)
      const resUser2 = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(resUser2.status).toBe(404);
      expect(resUser2.body.message).toContain('not found');
    });

    it('should return 404 when querying a non-existent loan ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/loans/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/loans/:id/repay - Loan Repayment', () => {
    it('should mark an unpaid loan as repaid and set repaidAt', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Kunal',
          amount: 800,
          dueDate: '2026-11-20',
        });
      const loanId = createRes.body.data.id;

      const repayRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${token1}`);

      expect(repayRes.status).toBe(200);
      expect(repayRes.body.success).toBe(true);
      expect(repayRes.body.data.isRepaid).toBe(true);
      expect(repayRes.body.data.repaidAt).toBeDefined();
    });

    it('should prevent duplicate repayment attempts with 400 Bad Request', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Kunal',
          amount: 800,
          dueDate: '2026-11-20',
        });
      const loanId = createRes.body.data.id;

      // 1st repayment
      await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${token1}`);

      // 2nd repayment attempt
      const duplicateRes = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${token1}`);

      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.message).toContain('already been marked as repaid');
    });

    it('should prevent User 2 from marking User 1 loan as repaid', async () => {
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Suresh',
          amount: 1200,
          dueDate: '2026-11-20',
        });
      const loanId = createRes.body.data.id;

      // User 2 tries to repay User 1's loan
      const res = await request(app)
        .patch(`/api/loans/${loanId}/repay`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/loans/summary - Financial Calculations & Rules', () => {
    it('should calculate accurate decimal financial metrics for user', async () => {
      // Loan 1: 1000.50 (unpaid, due in future)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Person A',
          amount: 1000.5,
          dueDate: '2026-12-31',
        });

      // Loan 2: 500.25 (will be repaid)
      const res2 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Person B',
          amount: 500.25,
          dueDate: '2026-12-31',
        });
      await request(app)
        .patch(`/api/loans/${res2.body.data.id}/repay`)
        .set('Authorization', `Bearer ${token1}`);

      // Loan 3: 300.25 (unpaid, overdue - due in past)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          friendName: 'Person C',
          amount: 300.25,
          dueDate: '2024-01-01',
        });

      // User 2 creates loan of 9999.00 (must NOT affect User 1)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          friendName: 'User2 Friend',
          amount: 9999,
          dueDate: '2026-12-31',
        });

      // Fetch User 1 Summary
      const summaryRes = await request(app)
        .get('/api/loans/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(summaryRes.status).toBe(200);
      const data = summaryRes.body.data;

      // Total Lent: 1000.50 + 500.25 + 300.25 = 1801.00
      expect(data.totalLent).toBe('1801.00');

      // Total Repaid: 500.25
      expect(data.totalRepaid).toBe('500.25');

      // Outstanding Balance: 1000.50 + 300.25 = 1300.75
      expect(data.outstandingBalance).toBe('1300.75');

      // Overdue Amount: 300.25
      expect(data.overdueAmount).toBe('300.25');

      // Counts
      expect(data.totalLoans).toBe(3);
      expect(data.pendingLoans).toBe(2);
      expect(data.repaidLoans).toBe(1);
    });
  });

  describe('GET /api/loans - Filter & Search', () => {
    beforeEach(async () => {
      // 1: Outstanding Future
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendName: 'Vikas Gupta', amount: 100, dueDate: '2026-12-31' });

      // 2: Overdue Past
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendName: 'Deepak Verma', amount: 200, dueDate: '2024-01-01' });

      // 3: Repaid
      const r = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${token1}`)
        .send({ friendName: 'Vikas Sharma', amount: 300, dueDate: '2026-12-31' });
      await request(app).patch(`/api/loans/${r.body.data.id}/repay`).set('Authorization', `Bearer ${token1}`);
    });

    it('should filter by OUTSTANDING status', async () => {
      const res = await request(app)
        .get('/api/loans?status=OUTSTANDING')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by REPAID status', async () => {
      const res = await request(app)
        .get('/api/loans?status=REPAID')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].friendName).toBe('Vikas Sharma');
    });

    it('should filter by OVERDUE status', async () => {
      const res = await request(app)
        .get('/api/loans?status=OVERDUE')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].friendName).toBe('Deepak Verma');
    });

    it('should search by friend name', async () => {
      const res = await request(app)
        .get('/api/loans?search=vikas')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });
});
