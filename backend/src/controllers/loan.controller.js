const { LoanService } = require('../services/loan.service');
const { PaymentService } = require('../services/payment.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class LoanController {
  static async createLoan(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const loan = await LoanService.createLoan(req.user.id, req.body);
      sendSuccess(res, loan, 'Loan created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getLoans(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await LoanService.getLoans(req.user.id, req.query);
      sendSuccess(res, result.loans, 'Loans retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getLoanById(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const loan = await LoanService.getLoanById(req.user.id, req.params.id);
      sendSuccess(res, loan, 'Loan retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async repayLoan(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updatedLoan = await LoanService.repayLoan(req.user.id, req.params.id);
      sendSuccess(res, updatedLoan, 'Loan marked as repaid successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateLoan(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await LoanService.updateLoan(req.user.id, req.params.id, req.body);
      sendSuccess(res, updated, 'Loan updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const summary = await LoanService.getSummary(req.user.id);
      sendSuccess(res, summary, 'Financial summary calculated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getLoanSummary(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const summary = await LoanService.getLoanSummary(req.user.id, req.params.id);
      sendSuccess(res, summary, 'Loan summary breakdown retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getLoanPayments(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payments = await LoanService.getLoanPayments(req.user.id, req.params.id);
      sendSuccess(res, payments, 'Loan payment history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createLoanPayment(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payload = { ...req.body, loanId: req.params.id };
      const result = await PaymentService.recordPayment(req.user.id, payload);
      sendSuccess(res, result, 'Payment recorded successfully against loan', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { LoanController };
