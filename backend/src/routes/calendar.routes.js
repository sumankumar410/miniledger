const { Router } = require('express');
const { DashboardController } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/due-dates', DashboardController.getCalendarDueDates);

module.exports = router;
