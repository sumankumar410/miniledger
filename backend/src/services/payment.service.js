const prisma = require('../config/db');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { formatMoney, toDecimal, Decimal } = require('../utils/decimal');

class PaymentService {
  /**
   * Record a payment (Full or Partial installment) against a loan
   */
  static async recordPayment(userId, data) {
    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, userId },
    });

    if (!loan) throw new NotFoundError('Loan not found or inaccessible');

    if (loan.isRepaid) {
      throw new BadRequestError('This loan is already fully settled.');
    }

    const paymentAmount = toDecimal(data.amount);
    if (paymentAmount.lte(0)) {
      throw new BadRequestError('Payment amount must be strictly greater than 0.');
    }

    const currentRemaining = toDecimal(loan.remainingBalance || loan.amount);
    if (paymentAmount.gt(currentRemaining)) {
      throw new BadRequestError(
        `Payment amount (₹${paymentAmount.toFixed(2)}) cannot exceed the current outstanding balance (₹${currentRemaining.toFixed(2)}).`
      );
    }

    const currentTotalPaid = toDecimal(loan.totalPaid || 0);
    const newTotalPaid = currentTotalPaid.plus(paymentAmount);
    const newRemaining = currentRemaining.minus(paymentAmount);
    const isNowSettled = newRemaining.lte(0.001);

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

    // 1. Create Payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        loanId: loan.id,
        amount: paymentAmount.toFixed(2),
        paymentDate: paymentDate.toISOString(),
        paymentMethod: data.paymentMethod || 'UPI',
        reference: data.reference || null,
        notes: data.notes || null,
      },
    });

    // 2. Update Loan record
    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        totalPaid: newTotalPaid.toFixed(2),
        remainingBalance: newRemaining.toFixed(2),
        isRepaid: isNowSettled,
        repaidAt: isNowSettled ? paymentDate : null,
      },
    });

    return {
      payment: {
        ...payment,
        amount: formatMoney(payment.amount),
      },
      loan: {
        ...updatedLoan,
        amount: formatMoney(updatedLoan.amount),
        totalPaid: formatMoney(updatedLoan.totalPaid),
        remainingBalance: formatMoney(updatedLoan.remainingBalance),
      },
    };
  }

  /**
   * List payments with optional loan filter
   */
  static async listPayments(userId, loanId = null) {
    const where = { userId };
    if (loanId) where.loanId = loanId;

    const [payments, loans] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { paymentDate: 'desc' } }),
      prisma.loan.findMany({ where: { userId } }),
    ]);

    return payments.map((p) => {
      const loan = loans.find((l) => l.id === p.loanId);
      return {
        ...p,
        amount: formatMoney(p.amount),
        friendName: loan ? loan.friendName : 'Friend',
        loanType: loan ? loan.type : 'LENT',
      };
    });
  }

  /**
   * Get single payment details
   */
  static async getPaymentById(userId, paymentId) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    const loan = await prisma.loan.findFirst({
      where: { id: payment.loanId, userId },
    });

    return {
      ...payment,
      amount: formatMoney(payment.amount),
      friendName: loan ? loan.friendName : 'Friend',
      loanType: loan ? loan.type : 'LENT',
    };
  }

  /**
   * Update payment metadata (method, reference, notes)
   */
  static async updatePayment(userId, paymentId, data) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentMethod: data.paymentMethod || payment.paymentMethod,
        reference: data.reference !== undefined ? data.reference : payment.reference,
        notes: data.notes !== undefined ? data.notes : payment.notes,
      },
    });

    return {
      ...updated,
      amount: formatMoney(updated.amount),
    };
  }

  /**
   * Delete / Revert a recorded payment and restore loan balance
   */
  static async deletePayment(userId, paymentId) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    const loan = await prisma.loan.findFirst({
      where: { id: payment.loanId, userId },
    });

    if (!loan) throw new NotFoundError('Associated loan not found');

    const paymentAmt = toDecimal(payment.amount);
    const currentPaid = toDecimal(loan.totalPaid || 0);
    const currentRemaining = toDecimal(loan.remainingBalance || loan.amount);

    const newTotalPaid = Decimal.max(0, currentPaid.minus(paymentAmt));
    const newRemaining = currentRemaining.plus(paymentAmt);

    // Delete payment
    await prisma.payment.delete({ where: { id: paymentId } });

    // Update loan balance
    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        totalPaid: newTotalPaid.toFixed(2),
        remainingBalance: newRemaining.toFixed(2),
        isRepaid: false,
        repaidAt: null,
      },
    });

    return {
      deletedPaymentId: paymentId,
      loan: {
        ...updatedLoan,
        amount: formatMoney(updatedLoan.amount),
        totalPaid: formatMoney(updatedLoan.totalPaid),
        remainingBalance: formatMoney(updatedLoan.remainingBalance),
      },
    };
  }

  /**
   * Attach receipt file to payment
   */
  static async attachReceipt(userId, paymentId, receiptUrl) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { receiptUrl },
    });

    return {
      ...updated,
      amount: formatMoney(updated.amount),
    };
  }
}

module.exports = { PaymentService };
