const prisma = require('../config/db');
const { LoanService } = require('./loan.service');
const { formatMoney } = require('../utils/decimal');

class DashboardService {
  /**
   * Comprehensive summary for dashboard cards
   */
  static async getSummary(userId) {
    const loanSummary = await LoanService.getSummary(userId);
    const friendsCount = await prisma.friend.findMany({ where: { userId } });

    return {
      ...loanSummary,
      totalFriends: friendsCount.length,
    };
  }

  /**
   * Get upcoming loan dues within 30 days
   */
  static async getUpcoming(userId) {
    const loans = await prisma.loan.findMany({
      where: { userId, isRepaid: false },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const upcoming = [];

    loans.forEach((loan) => {
      if (!loan.dueDate) return;
      const due = new Date(loan.dueDate);
      const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      if (dueMidnight >= today && dueMidnight <= thirtyDays) {
        const daysRemaining = Math.ceil((dueMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        upcoming.push({
          ...loan,
          amount: formatMoney(loan.amount),
          totalPaid: formatMoney(loan.totalPaid),
          remainingBalance: formatMoney(loan.remainingBalance || loan.amount),
          daysRemaining,
        });
      }
    });

    return upcoming;
  }

  /**
   * Get overdue loans
   */
  static async getOverdue(userId) {
    const loans = await prisma.loan.findMany({
      where: { userId, isRepaid: false },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = [];

    loans.forEach((loan) => {
      if (!loan.dueDate) return;
      const due = new Date(loan.dueDate);
      const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      if (dueMidnight < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24));
        overdue.push({
          ...loan,
          amount: formatMoney(loan.amount),
          totalPaid: formatMoney(loan.totalPaid),
          remainingBalance: formatMoney(loan.remainingBalance || loan.amount),
          daysOverdue,
        });
      }
    });

    return overdue;
  }

  /**
   * Loans grouped by due date for calendar view
   */
  static async getCalendarDueDates(userId) {
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
    });

    const calendarMap = {};

    loans.forEach((loan) => {
      if (!loan.dueDate) return;
      const dateKey = new Date(loan.dueDate).toISOString().split('T')[0];
      if (!calendarMap[dateKey]) {
        calendarMap[dateKey] = [];
      }
      calendarMap[dateKey].push({
        id: loan.id,
        friendName: loan.friendName,
        type: loan.type,
        amount: formatMoney(loan.amount),
        remainingBalance: formatMoney(loan.remainingBalance || loan.amount),
        isRepaid: loan.isRepaid,
      });
    });

    return calendarMap;
  }
}

module.exports = { DashboardService };
