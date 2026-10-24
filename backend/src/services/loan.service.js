const { Prisma } = require('@prisma/client');
const prisma = require('../config/db');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { formatMoney, toDecimal, Decimal } = require('../utils/decimal');

class LoanService {
  /**
   * Create a new loan (Money Lent OR Money Borrowed)
   */
  static async createLoan(userId, data) {
    if (!data.amount || Number(data.amount) <= 0) {
      throw new BadRequestError('Loan amount must be strictly greater than 0');
    }
    if (!data.friendName || data.friendName.trim().length === 0) {
      throw new BadRequestError('Friend name is required');
    }

    const type = data.type === 'BORROWED' ? 'BORROWED' : 'LENT';
    const amountDec = Number(data.amount).toFixed(2);
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError('Valid due date is required');
    }

    const loanDate = data.loanDate
      ? new Date(data.loanDate)
      : new Date(Math.min(Date.now(), dueDate.getTime()));

    if (data.loanDate && dueDate < new Date(data.loanDate)) {
      throw new BadRequestError('Due date cannot be earlier than the loan date');
    }

    // Auto-create or link friend if friendId not provided
    let friendId = data.friendId || null;
    if (!friendId) {
      const existingFriend = await prisma.friend.findFirst({
        where: { userId, name: data.friendName.trim() },
      });
      if (existingFriend) {
        friendId = existingFriend.id;
      } else {
        const newFriend = await prisma.friend.create({
          data: { userId, name: data.friendName.trim() },
        });
        friendId = newFriend.id;
      }
    }

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendId,
        friendName: data.friendName.trim(),
        type,
        amount: new Prisma.Decimal(amountDec),
        totalPaid: new Prisma.Decimal('0.00'),
        remainingBalance: new Prisma.Decimal(amountDec),
        loanDate,
        dueDate,
        interestRate: data.interestRate ? Number(data.interestRate) : 0,
        paymentSchedule: data.paymentSchedule || 'ONE_TIME',
        notes: data.notes?.trim() || '',
      },
    });

    return {
      ...loan,
      amount: formatMoney(loan.amount),
      totalPaid: formatMoney(loan.totalPaid),
      remainingBalance: formatMoney(loan.remainingBalance),
    };
  }

  /**
   * Get all loans with filters (type, status, search, pagination)
   */
  static async getLoans(userId, filters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = { userId };

    // Filter by type: LENT | BORROWED
    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type.toUpperCase();
    }

    // Filter by status
    if (filters.status === 'OUTSTANDING') {
      where.isRepaid = false;
    } else if (filters.status === 'REPAID') {
      where.isRepaid = true;
    } else if (filters.status === 'OVERDUE') {
      where.isRepaid = false;
      where.dueDate = { lt: now };
    }

    // Filter by friendId
    if (filters.friendId) {
      where.friendId = filters.friendId;
    }

    // Search by friendName
    if (filters.search && filters.search.trim() !== '') {
      where.friendName = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [total, loans] = await Promise.all([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const formattedLoans = loans.map((loan) => {
      const isOverdue = !loan.isRepaid && new Date(loan.dueDate) < now;
      return {
        ...loan,
        amount: formatMoney(loan.amount),
        totalPaid: formatMoney(loan.totalPaid || 0),
        remainingBalance: formatMoney(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount)),
        isOverdue,
      };
    });

    return {
      loans: formattedLoans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get loan by ID with its full payment timeline
   */
  static async getLoanById(userId, loanId) {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });

    if (!loan) {
      throw new NotFoundError('Loan not found or you do not have permission to access it');
    }

    const payments = await prisma.payment.findMany({
      where: { loanId: loan.id, userId },
      orderBy: { paymentDate: 'desc' },
    });

    const now = new Date();
    return {
      ...loan,
      amount: formatMoney(loan.amount),
      totalPaid: formatMoney(loan.totalPaid || 0),
      remainingBalance: formatMoney(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount)),
      isOverdue: !loan.isRepaid && new Date(loan.dueDate) < now,
      payments: payments.map((p) => ({
        ...p,
        amount: formatMoney(p.amount),
      })),
    };
  }

  /**
   * Legacy quick repay (marks full repayment)
   */
  static async repayLoan(userId, loanId) {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });

    if (!loan) throw new NotFoundError('Loan not found or permission denied');
    if (loan.isRepaid) throw new BadRequestError('Loan has already been marked as repaid');

    const amount = toDecimal(loan.amount);
    const now = new Date();

    // Also record a payment record for consistency
    await prisma.payment.create({
      data: {
        userId,
        loanId: loan.id,
        amount: amount.toFixed(2),
        paymentDate: now.toISOString(),
        paymentMethod: 'CASH',
        notes: 'Full settlement',
      },
    });

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: {
        isRepaid: true,
        repaidAt: now,
        totalPaid: amount.toFixed(2),
        remainingBalance: '0.00',
      },
    });

    return {
      ...updated,
      amount: formatMoney(updated.amount),
      totalPaid: formatMoney(updated.totalPaid),
      remainingBalance: '0.00',
      isOverdue: false,
    };
  }

  /**
   * Update permitted details (notes, dueDate)
   */
  static async updateLoan(userId, loanId, data) {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });

    if (!loan) throw new NotFoundError('Loan not found');

    const updateData = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
    });

    return {
      ...updated,
      amount: formatMoney(updated.amount),
      totalPaid: formatMoney(updated.totalPaid),
      remainingBalance: formatMoney(updated.remainingBalance),
    };
  }

  /**
   * MiniLedger 2.0 Comprehensive Financial Summary
   */
  static async getSummary(userId) {
    const now = new Date();

    const loans = await prisma.loan.findMany({
      where: { userId },
    });

    let totalLent = new Decimal(0);
    let totalBorrowed = new Decimal(0);
    let totalRepaymentsReceived = new Decimal(0);
    let totalRepaymentsMade = new Decimal(0);
    let outstandingReceivables = new Decimal(0);
    let outstandingPayables = new Decimal(0);
    let overdueAmount = new Decimal(0);

    let totalLoans = 0;
    let pendingLoans = 0;
    let repaidLoans = 0;
    let upcomingCount = 0;

    // Monthly activity buckets (last 6 months)
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short' });
      monthlyMap[key] = { month: key, lent: 0, borrowed: 0, repaid: 0 };
    }

    for (const loan of loans) {
      totalLoans++;
      const amountDec = toDecimal(loan.amount);
      const paidDec = toDecimal(loan.totalPaid || (loan.isRepaid ? loan.amount : 0));
      const remainingDec = toDecimal(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount));

      const isBorrowed = loan.type === 'BORROWED';

      if (isBorrowed) {
        totalBorrowed = totalBorrowed.plus(amountDec);
        totalRepaymentsMade = totalRepaymentsMade.plus(paidDec);
        if (!loan.isRepaid && remainingDec.gt(0)) {
          outstandingPayables = outstandingPayables.plus(remainingDec);
          pendingLoans++;
          if (new Date(loan.dueDate) < now) {
            overdueAmount = overdueAmount.plus(remainingDec);
          }
        } else {
          repaidLoans++;
        }
      } else {
        // LENT
        totalLent = totalLent.plus(amountDec);
        totalRepaymentsReceived = totalRepaymentsReceived.plus(paidDec);
        if (!loan.isRepaid && remainingDec.gt(0)) {
          outstandingReceivables = outstandingReceivables.plus(remainingDec);
          pendingLoans++;
          if (new Date(loan.dueDate) < now) {
            overdueAmount = overdueAmount.plus(remainingDec);
          }
        } else {
          repaidLoans++;
        }
      }

      // Check upcoming (due within next 30 days)
      if (!loan.isRepaid) {
        const dueTime = new Date(loan.dueDate).getTime();
        const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
          upcomingCount++;
        }
      }

      // Monthly mapping
      const loanMonthKey = new Date(loan.createdAt || now).toLocaleString('en-US', { month: 'short' });
      if (monthlyMap[loanMonthKey]) {
        if (isBorrowed) {
          monthlyMap[loanMonthKey].borrowed += amountDec.toNumber();
        } else {
          monthlyMap[loanMonthKey].lent += amountDec.toNumber();
        }
        monthlyMap[loanMonthKey].repaid += paidDec.toNumber();
      }
    }

    return {
      totalLent: totalLent.toFixed(2),
      totalBorrowed: totalBorrowed.toFixed(2),
      totalRepaid: totalRepaymentsReceived.toFixed(2), // backward compat
      totalRepaymentsReceived: totalRepaymentsReceived.toFixed(2),
      totalRepaymentsMade: totalRepaymentsMade.toFixed(2),
      outstandingBalance: outstandingReceivables.toFixed(2), // backward compat
      outstandingReceivables: outstandingReceivables.toFixed(2),
      outstandingPayables: outstandingPayables.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2),
      upcomingPayments: upcomingCount,
      totalLoans,
      pendingLoans,
      repaidLoans,
      monthlyActivity: Object.values(monthlyMap),
    };
  }

  /**
   * Detailed breakdown for a single loan
   */
  static async getLoanSummary(userId, loanId) {
    const loan = await this.getLoanById(userId, loanId);
    const payments = await prisma.payment.findMany({
      where: { userId, loanId },
      orderBy: { paymentDate: 'desc' },
    });

    const amountDec = toDecimal(loan.amount);
    const totalPaidDec = toDecimal(loan.totalPaid || 0);
    const remainingDec = toDecimal(loan.remainingBalance || loan.amount);

    const percentPaid = amountDec.gt(0)
      ? Math.min(100, totalPaidDec.dividedBy(amountDec).times(100).toNumber()).toFixed(1)
      : '0.0';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let daysRemaining = null;
    let daysOverdue = null;
    let computedStatus = loan.isRepaid ? 'SETTLED' : 'ACTIVE';

    if (loan.dueDate && !loan.isRepaid) {
      const due = new Date(loan.dueDate);
      const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffMs = dueMidnight.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        computedStatus = 'OVERDUE';
        daysOverdue = Math.abs(diffDays);
      } else {
        daysRemaining = diffDays;
      }
    }

    return {
      loanId: loan.id,
      friendName: loan.friendName,
      type: loan.type,
      originalAmount: formatMoney(loan.amount),
      totalPaid: formatMoney(loan.totalPaid),
      remainingBalance: formatMoney(loan.remainingBalance),
      percentagePaid: Number(percentPaid),
      status: computedStatus,
      isRepaid: loan.isRepaid,
      repaidAt: loan.repaidAt,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      daysRemaining,
      daysOverdue,
      paymentCount: payments.length,
      recentPayments: payments.slice(0, 5).map((p) => ({
        ...p,
        amount: formatMoney(p.amount),
      })),
    };
  }

  /**
   * Get all payment installments for a specific loan
   */
  static async getLoanPayments(userId, loanId) {
    // Verify loan ownership first
    await this.getLoanById(userId, loanId);

    const payments = await prisma.payment.findMany({
      where: { userId, loanId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map((p) => ({
      ...p,
      amount: formatMoney(p.amount),
    }));
  }
}

module.exports = { LoanService };
