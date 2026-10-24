const { Router } = require('express');
const { DashboardController } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/summary', DashboardController.getSummary);
router.get('/upcoming', DashboardController.getUpcoming);
router.get('/overdue', DashboardController.getOverdue);
router.get('/calendar', DashboardController.getCalendarDueDates);

module.exports = router;
