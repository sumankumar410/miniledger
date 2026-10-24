const { Router } = require('express');
const { ReportController } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/monthly', ReportController.getMonthly);
router.get('/friends', ReportController.getFriends);
router.get('/export', ReportController.exportCsv);

module.exports = router;
