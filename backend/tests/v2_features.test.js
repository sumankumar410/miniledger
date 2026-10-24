const request = require('supertest');
const jwt = require('jsonwebtoken');
const { mockDb } = require('./helpers/mockDb');

// Mock Prisma
jest.mock('../src/config/db', () => mockDb);

const app = require('../src/app');
const { env } = require('../src/config/env');

describe('MiniLedger 2.0 Extended Features Integration Tests', () => {
  let user, token;
  let friend;
  let lentLoan;

  beforeEach(async () => {
    mockDb.reset();
    jest.clearAllMocks();

    // Create User
    user = await mockDb.user.upsert({
      where: { phoneNumber: '9876543210' },
      create: { phoneNumber: '9876543210' },
    });
    token = jwt.sign({ userId: user.id, phoneNumber: user.phoneNumber }, env.JWT_SECRET);

    // Create Friend
    friend = await mockDb.friend.create({
      data: {
        userId: user.id,
        name: 'Aarav Patel',
        phoneNumber: '9988776655',
        email: 'aarav@example.com',
      },
    });

    // Create Loan (LENT ₹5000)
    lentLoan = await mockDb.loan.create({
      data: {
        userId: user.id,
        friendId: friend.id,
        friendName: friend.name,
        type: 'LENT',
        amount: 5000,
        dueDate: '2026-12-15',
      },
    });
  });

  describe('Friend Extended APIs (Summary & Statement)', () => {
    it('should retrieve friend summary with accurate balance', async () => {
      const res = await request(app)
        .get(`/api/friends/${friend.id}/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Aarav Patel');
      expect(res.body.data.totalLent).toBe('5000.00');
      expect(res.body.data.netBalance).toBe('5000.00');
    });

    it('should generate chronological friend statement with running balance', async () => {
      // Record a partial payment
      await request(app)
        .post(`/api/loans/${lentLoan.id}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 2000,
          paymentMethod: 'UPI',
          notes: 'First installment',
        });

      const res = await request(app)
        .get(`/api/friends/${friend.id}/statement`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statement.length).toBe(2); // 1 loan + 1 payment
      expect(res.body.data.statement[0].type).toBe('LOAN_LENT');
      expect(res.body.data.statement[1].type).toBe('PAYMENT');
      expect(res.body.data.finalNetBalance).toBe('3000.00');
    });
  });

  describe('Loan Detailed Summary & Specific Payments', () => {
    it('should retrieve detailed loan summary breakdown', async () => {
      const res = await request(app)
        .get(`/api/loans/${lentLoan.id}/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalAmount).toBe('5000.00');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.percentagePaid).toBe(0);
    });

    it('should record payment directly via POST /api/loans/:id/payments', async () => {
      const res = await request(app)
        .post(`/api/loans/${lentLoan.id}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 1500,
          paymentMethod: 'CASH',
          notes: 'Cash installment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.amount).toBe('1500.00');
      expect(res.body.data.loan.remainingBalance).toBe('3500.00');
      expect(res.body.data.loan.isRepaid).toBe(false);

      // Verify list of payments for loan
      const listRes = await request(app)
        .get(`/api/loans/${lentLoan.id}/payments`)
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
    });
  });

  describe('Payment Deletion & Balance Restoration', () => {
    it('should delete a payment and safely restore loan remaining balance', async () => {
      // 1. Pay 3000
      const payRes = await request(app)
        .post(`/api/loans/${lentLoan.id}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 3000, paymentMethod: 'UPI' });

      const paymentId = payRes.body.data.payment.id;

      // 2. Delete payment
      const delRes = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.data.loan.remainingBalance).toBe('5000.00');
      expect(delRes.body.data.loan.totalPaid).toBe('0.00');
    });
  });

  describe('Dashboard & Calendar APIs', () => {
    it('should return dashboard overview summary metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalLent).toBe('5000.00');
      expect(res.body.data.totalFriends).toBe(1);
    });

    it('should return calendar due date mappings', async () => {
      const res = await request(app)
        .get('/api/calendar/due-dates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('2026-12-15');
    });
  });

  describe('Scheduled Reminders & Notifications', () => {
    it('should schedule and manage custom reminders', async () => {
      const res = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          loanId: lentLoan.id,
          reminderDateTime: '2026-12-10T10:00:00Z',
          channel: 'WHATSAPP',
          notes: 'Remind Aarav gently on WhatsApp',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/reminders/scheduled')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
    });

    it('should list and mark in-app notifications as read', async () => {
      // Create notification
      await mockDb.notification.create({
        data: {
          userId: user.id,
          title: 'Test Notification',
          message: 'Payment due tomorrow',
          type: 'INFO',
        },
      });

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.notifications.length).toBe(1);
      expect(listRes.body.data.unreadCount).toBe(1);

      const notifId = listRes.body.data.notifications[0].id;
      const readRes = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.readAt).toBeTruthy();
    });
  });

  describe('Reports & CSV Streaming Export', () => {
    it('should return 12-month financial breakdown', async () => {
      const res = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(12);
    });

    it('should export loans as downloadable CSV file with correct headers', async () => {
      const res = await request(app)
        .get('/api/reports/export?type=loans')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Loan ID,Loan Date,Due Date,Friend Name');
      expect(res.text).toContain('Aarav Patel');
    });
  });
});
