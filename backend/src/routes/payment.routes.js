const { Router } = require('express');
const { PaymentController } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = Router();

router.use(authenticate);

router.post('/', PaymentController.create);
router.get('/', PaymentController.list);
router.get('/:id', PaymentController.getById);
router.patch('/:id', PaymentController.update);
router.delete('/:id', PaymentController.delete);
router.post('/:id/receipt', upload.single('receipt'), PaymentController.uploadReceipt);
router.get('/:id/receipt', PaymentController.getReceipt);

module.exports = router;
