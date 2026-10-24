const prisma = require('../config/db');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { formatMoney, toDecimal, Decimal } = require('../utils/decimal');

class FriendService {
  /**
   * Get all friends for user with aggregated financial metrics
   */
  static async listFriends(userId) {
    const [friends, loans] = await Promise.all([
      prisma.friend.findMany({ where: { userId, isArchived: false } }),
      prisma.loan.findMany({ where: { userId } }),
    ]);

    return friends.map((friend) => {
      const friendLoans = loans.filter(
        (l) => l.friendId === friend.id || l.friendName.toLowerCase() === friend.name.toLowerCase()
      );

      let totalLent = new Decimal(0);
      let totalBorrowed = new Decimal(0);
      let outstandingReceivable = new Decimal(0);
      let outstandingPayable = new Decimal(0);
      let activeLoansCount = 0;

      for (const loan of friendLoans) {
        const remaining = toDecimal(loan.remainingBalance || (loan.isRepaid ? 0 : loan.amount));
        const amount = toDecimal(loan.amount);

        if (loan.type === 'BORROWED') {
          totalBorrowed = totalBorrowed.plus(amount);
          if (!loan.isRepaid && remaining.gt(0)) {
            outstandingPayable = outstandingPayable.plus(remaining);
            activeLoansCount++;
          }
        } else {
          totalLent = totalLent.plus(amount);
          if (!loan.isRepaid && remaining.gt(0)) {
            outstandingReceivable = outstandingReceivable.plus(remaining);
            activeLoansCount++;
          }
        }
      }

      const netBalance = outstandingReceivable.minus(outstandingPayable);

      return {
        ...friend,
        totalLent: totalLent.toFixed(2),
        totalBorrowed: totalBorrowed.toFixed(2),
        outstandingReceivable: outstandingReceivable.toFixed(2),
        outstandingPayable: outstandingPayable.toFixed(2),
        netBalance: netBalance.toFixed(2),
        activeLoansCount,
        totalLoansCount: friendLoans.length,
      };
    });
  }

  /**
   * Create a new friend
   */
  static async createFriend(userId, data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestError('Friend name is required');
    }

    return await prisma.friend.create({
      data: {
        userId,
        name: data.name.trim(),
        phoneNumber: data.phoneNumber || data.phone || null,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
  }

  /**
   * Get friend details with all loans
   */
  static async getFriendById(userId, friendId) {
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
    });

    if (!friend) throw new NotFoundError('Friend not found');

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const friendLoans = loans
      .filter((l) => l.friendId === friend.id || l.friendName.toLowerCase() === friend.name.toLowerCase())
      .map((l) => ({
        ...l,
        amount: formatMoney(l.amount),
        totalPaid: formatMoney(l.totalPaid),
        remainingBalance: formatMoney(l.remainingBalance),
      }));

    return {
      ...friend,
      loans: friendLoans,
    };
  }

  /**
   * Update friend info
   */
  static async updateFriend(userId, friendId, data) {
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
    });

    if (!friend) throw new NotFoundError('Friend not found');

    return await prisma.friend.update({
      where: { id: friendId },
      data: {
        name: data.name ? data.name.trim() : friend.name,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : data.phone !== undefined ? data.phone : friend.phoneNumber,
        email: data.email !== undefined ? data.email?.trim() || null : friend.email,
        notes: data.notes !== undefined ? data.notes?.trim() || null : friend.notes,
      },
    });
  }

  /**
   * Safe delete or archive friend
   */
  static async deleteFriend(userId, friendId) {
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
    });

    if (!friend) throw new NotFoundError('Friend not found');

    const loans = await prisma.loan.findMany({
      where: { userId, isRepaid: false },
    });

    const activeLoans = loans.filter(
      (l) => l.friendId === friend.id || l.friendName.toLowerCase() === friend.name.toLowerCase()
    );

    if (activeLoans.length > 0) {
      throw new BadRequestError(
        `Cannot delete friend with ${activeLoans.length} active outstanding loan(s). Please settle all loans first.`
      );
    }

    // If historical loans exist, archive instead of destructive hard delete
    const allFriendLoans = await prisma.loan.findMany({
      where: { userId, friendId: friend.id },
    });

    if (allFriendLoans.length > 0) {
      return await prisma.friend.update({
        where: { id: friendId },
        data: { isArchived: true },
      });
    }

    return await prisma.friend.delete({ where: { id: friendId } });
  }

  /**
   * GET /api/friends/:id/summary
   */
  static async getFriendSummary(userId, friendId) {
    const friend = await this.getFriendById(userId, friendId);

    let totalLent = new Decimal(0);
    let totalBorrowed = new Decimal(0);
    let totalRepaymentsReceived = new Decimal(0);
    let totalRepaymentsMade = new Decimal(0);
    let activeReceivables = new Decimal(0);
    let activePayables = new Decimal(0);

    for (const loan of friend.loans) {
      const amount = toDecimal(loan.amount);
      const paid = toDecimal(loan.totalPaid);
      const remaining = toDecimal(loan.remainingBalance);

      if (loan.type === 'BORROWED') {
        totalBorrowed = totalBorrowed.plus(amount);
        totalRepaymentsMade = totalRepaymentsMade.plus(paid);
        if (!loan.isRepaid) activePayables = activePayables.plus(remaining);
      } else {
        totalLent = totalLent.plus(amount);
        totalRepaymentsReceived = totalRepaymentsReceived.plus(paid);
        if (!loan.isRepaid) activeReceivables = activeReceivables.plus(remaining);
      }
    }

    return {
      friendId: friend.id,
      name: friend.name,
      totalLent: totalLent.toFixed(2),
      totalBorrowed: totalBorrowed.toFixed(2),
      totalRepaymentsReceived: totalRepaymentsReceived.toFixed(2),
      totalRepaymentsMade: totalRepaymentsMade.toFixed(2),
      activeReceivables: activeReceivables.toFixed(2),
      activePayables: activePayables.toFixed(2),
      netBalance: activeReceivables.minus(activePayables).toFixed(2),
      totalLoansCount: friend.loans.length,
    };
  }

  /**
   * GET /api/friends/:id/statement
   * Chronological ledger of loans + payments with running balance
   */
  static async getFriendStatement(userId, friendId) {
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
    });

    if (!friend) throw new NotFoundError('Friend not found');

    const [loans, payments] = await Promise.all([
      prisma.loan.findMany({ where: { userId, friendId } }),
      prisma.payment.findMany({ where: { userId } }),
    ]);

    const loanIds = new Set(loans.map((l) => l.id));
    const friendPayments = payments.filter((p) => loanIds.has(p.loanId));

    // Combine into chronological events
    const events = [];

    loans.forEach((l) => {
      events.push({
        id: l.id,
        date: l.loanDate || l.createdAt,
        type: l.type === 'LENT' ? 'LOAN_LENT' : 'LOAN_BORROWED',
        description: `${l.type === 'LENT' ? 'Lent money to' : 'Borrowed money from'} ${friend.name}`,
        amount: formatMoney(l.amount),
        direction: l.type === 'LENT' ? '+' : '-',
      });
    });

    friendPayments.forEach((p) => {
      const parentLoan = loans.find((l) => l.id === p.loanId);
      const isLent = parentLoan?.type === 'LENT';
      events.push({
        id: p.id,
        date: p.paymentDate,
        type: 'PAYMENT',
        description: `Repayment (${p.paymentMethod}) - ${p.notes || 'Installment'}`,
        amount: formatMoney(p.amount),
        direction: isLent ? '-' : '+',
      });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = new Decimal(0);
    const ledger = events.map((ev) => {
      const amt = toDecimal(ev.amount);
      if (ev.direction === '+') {
        runningBalance = runningBalance.plus(amt);
      } else {
        runningBalance = runningBalance.minus(amt);
      }

      return {
        ...ev,
        runningNetBalance: runningBalance.toFixed(2),
      };
    });

    return {
      friend: { id: friend.id, name: friend.name },
      statement: ledger,
      finalNetBalance: runningBalance.toFixed(2),
    };
  }
}

module.exports = { FriendService };
