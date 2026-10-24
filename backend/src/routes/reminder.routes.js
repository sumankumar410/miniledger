const { Router } = require('express');
const { ReminderController } = require('../controllers/reminder.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', ReminderController.getReminders);
router.get('/scheduled', ReminderController.listScheduled);
router.post('/', ReminderController.create);
router.patch('/:id', ReminderController.update);
router.delete('/:id', ReminderController.delete);

module.exports = router;
