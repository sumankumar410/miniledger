const { Router } = require('express');
const { FriendController } = require('../controllers/friend.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', FriendController.list);
router.post('/', FriendController.create);
router.get('/:id', FriendController.getById);
router.get('/:id/summary', FriendController.getSummary);
router.get('/:id/statement', FriendController.getStatement);
router.patch('/:id', FriendController.update);
router.delete('/:id', FriendController.delete);

module.exports = router;
