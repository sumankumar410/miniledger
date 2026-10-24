const { Router } = require('express');
const { LoanController } = require('../controllers/loan.controller');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { createLoanSchema, getLoansQuerySchema, loanIdParamSchema } = require('../schemas/loan.schema');

const router = Router();

router.use(authenticate);

router.get('/summary', LoanController.getSummary);
router.post('/', validateRequest(createLoanSchema), LoanController.createLoan);
router.get('/', validateRequest(getLoansQuerySchema), LoanController.getLoans);
router.get('/:id', validateRequest(loanIdParamSchema), LoanController.getLoanById);
router.get('/:id/summary', validateRequest(loanIdParamSchema), LoanController.getLoanSummary);
router.get('/:id/payments', validateRequest(loanIdParamSchema), LoanController.getLoanPayments);
router.post('/:id/payments', validateRequest(loanIdParamSchema), LoanController.createLoanPayment);
router.patch('/:id', validateRequest(loanIdParamSchema), LoanController.updateLoan);
router.patch('/:id/repay', validateRequest(loanIdParamSchema), LoanController.repayLoan);

module.exports = router;
