const { Router } = require('express');
const authRoutes = require('./auth.routes');
const loanRoutes = require('./loan.routes');
const friendRoutes = require('./friend.routes');
const paymentRoutes = require('./payment.routes');
const reminderRoutes = require('./reminder.routes');
const dashboardRoutes = require('./dashboard.routes');
const calendarRoutes = require('./calendar.routes');
const notificationRoutes = require('./notification.routes');
const reportRoutes = require('./report.routes');

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'MiniLedger 2.0 API',
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/friends', friendRoutes);
router.use('/payments', paymentRoutes);
router.use('/reminders', reminderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
