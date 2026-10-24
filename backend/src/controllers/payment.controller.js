const path = require('path');
const fs = require('fs');
const { PaymentService } = require('../services/payment.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');

class PaymentController {
  static async create(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await PaymentService.recordPayment(req.user.id, req.body);
      sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payments = await PaymentService.listPayments(req.user.id, req.query.loanId);
      sendSuccess(res, payments, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payment = await PaymentService.getPaymentById(req.user.id, req.params.id);
      sendSuccess(res, payment, 'Payment details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await PaymentService.updatePayment(req.user.id, req.params.id, req.body);
      sendSuccess(res, updated, 'Payment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await PaymentService.deletePayment(req.user.id, req.params.id);
      sendSuccess(res, result, 'Payment deleted and loan balance restored successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadReceipt(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!req.file) throw new BadRequestError('Receipt file is required (PDF, PNG, JPG, or WEBP)');

      const receiptUrl = `/uploads/receipts/${req.file.filename}`;
      const result = await PaymentService.attachReceipt(req.user.id, req.params.id, receiptUrl);
      sendSuccess(res, result, 'Receipt uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const payment = await PaymentService.getPaymentById(req.user.id, req.params.id);
      if (!payment.receiptUrl) throw new NotFoundError('No receipt attached to this payment');

      const filename = path.basename(payment.receiptUrl);
      const filePath = path.join(__dirname, '../../uploads/receipts', filename);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundError('Receipt file not found on disk');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { PaymentController };
