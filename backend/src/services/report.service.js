const prisma = require('../config/db');
const { formatMoney, toDecimal, Decimal } = require('../utils/decimal');
const { FriendService } = require('./friend.service');

class ReportService {
  /**
   * Monthly report breakdown for a given year (defaults to current year)
   */
  static async getMonthlyBreakdown(userId, year = new Date().getFullYear()) {
    const loans = await prisma.loan.findMany({ where: { userId } });
    const payments = await prisma.payment.findMany({ where: { userId } });

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyData = months.map((m, idx) => ({
      month: m,
      monthIndex: idx,
      year: Number(year),
      lent: 0,
      borrowed: 0,
      repaymentsReceived: 0,
      repaymentsMade: 0,
      netCashflow: 0,
    }));

    // Process loans
    loans.forEach((loan) => {
      const d = new Date(loan.loanDate || loan.createdAt);
      if (d.getFullYear() === Number(year)) {
        const mIdx = d.getMonth();
        const amt = toDecimal(loan.amount).toNumber();
        if (loan.type === 'BORROWED') {
          monthlyData[mIdx].borrowed += amt;
        } else {
          monthlyData[mIdx].lent += amt;
        }
      }
    });

    // Process payments
    payments.forEach((payment) => {
      const d = new Date(payment.paymentDate || payment.createdAt);
      if (d.getFullYear() === Number(year)) {
        const mIdx = d.getMonth();
        const amt = toDecimal(payment.amount).toNumber();
        const loan = loans.find((l) => l.id === payment.loanId);
        if (loan?.type === 'BORROWED') {
          monthlyData[mIdx].repaymentsMade += amt;
        } else {
          monthlyData[mIdx].repaymentsReceived += amt;
        }
      }
    });

    // Calculate net cashflow
    monthlyData.forEach((item) => {
      // Cashflow from my perspective: +received & +borrowed (incoming cash) -lent & -repaid (outgoing cash)
      item.netCashflow = (item.repaymentsReceived - item.lent) + (item.borrowed - item.repaymentsMade);
      item.lent = Number(item.lent.toFixed(2));
      item.borrowed = Number(item.borrowed.toFixed(2));
      item.repaymentsReceived = Number(item.repaymentsReceived.toFixed(2));
      item.repaymentsMade = Number(item.repaymentsMade.toFixed(2));
      item.netCashflow = Number(item.netCashflow.toFixed(2));
    });

    return monthlyData;
  }

  /**
   * Per-friend financial breakdown
   */
  static async getFriendsReport(userId) {
    const friends = await prisma.friend.findMany({ where: { userId } });
    const reports = [];

    for (const friend of friends) {
      const summary = await FriendService.getFriendSummary(userId, friend.id);
      reports.push({
        friendId: friend.id,
        name: friend.name,
        phoneNumber: friend.phoneNumber || friend.phone || null,
        email: friend.email || null,
        ...summary,
      });
    }

    return reports;
  }

  /**
   * Generate CSV export
   */
  static async generateCsvExport(userId, type = 'loans', friendId = null) {
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { paymentDate: 'desc' },
      });
      const loans = await prisma.loan.findMany({ where: { userId } });

      const headers = ['Payment ID', 'Payment Date', 'Friend Name', 'Loan Type', 'Amount (INR)', 'Payment Method', 'Reference', 'Notes'];
      const rows = [headers.join(',')];

      payments.forEach((p) => {
        const loan = loans.find((l) => l.id === p.loanId);
        rows.push([
          escapeCsv(p.id),
          escapeCsv(new Date(p.paymentDate).toISOString().split('T')[0]),
          escapeCsv(loan?.friendName || 'N/A'),
          escapeCsv(loan?.type || 'LENT'),
          escapeCsv(toDecimal(p.amount).toFixed(2)),
          escapeCsv(p.paymentMethod),
          escapeCsv(p.reference || ''),
          escapeCsv(p.notes || ''),
        ].join(','));
      });

      return {
        filename: `miniledger_payments_${Date.now()}.csv`,
        content: rows.join('\r\n'),
      };
    }

    if (type === 'statement' && friendId) {
      const statementData = await FriendService.getFriendStatement(userId, friendId);
      const headers = ['Date', 'Type', 'Description', 'Amount (INR)', 'Running Net Balance (INR)'];
      const rows = [headers.join(',')];

      statementData.statement.forEach((ev) => {
        rows.push([
          escapeCsv(new Date(ev.date).toISOString().split('T')[0]),
          escapeCsv(ev.type),
          escapeCsv(ev.description),
          escapeCsv(`${ev.direction} ${ev.amount}`),
          escapeCsv(ev.runningNetBalance),
        ].join(','));
      });

      return {
        filename: `statement_${statementData.friend.name.replace(/\s+/g, '_')}_${Date.now()}.csv`,
        content: rows.join('\r\n'),
      };
    }

    // Default: 'loans'
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Loan ID',
      'Loan Date',
      'Due Date',
      'Friend Name',
      'Type',
      'Original Amount (INR)',
      'Total Paid (INR)',
      'Remaining Balance (INR)',
      'Status',
      'Notes',
    ];
    const rows = [headers.join(',')];

    loans.forEach((l) => {
      const isSettled = l.isRepaid;
      const isOverdue = !isSettled && l.dueDate && new Date(l.dueDate) < new Date();
      const status = isSettled ? 'SETTLED' : isOverdue ? 'OVERDUE' : 'ACTIVE';

      rows.push([
        escapeCsv(l.id),
        escapeCsv(l.loanDate ? new Date(l.loanDate).toISOString().split('T')[0] : ''),
        escapeCsv(l.dueDate ? new Date(l.dueDate).toISOString().split('T')[0] : 'N/A'),
        escapeCsv(l.friendName),
        escapeCsv(l.type),
        escapeCsv(toDecimal(l.amount).toFixed(2)),
        escapeCsv(toDecimal(l.totalPaid || 0).toFixed(2)),
        escapeCsv(toDecimal(l.remainingBalance || l.amount).toFixed(2)),
        escapeCsv(status),
        escapeCsv(l.notes || ''),
      ].join(','));
    });

    return {
      filename: `miniledger_loans_${Date.now()}.csv`,
      content: rows.join('\r\n'),
    };
  }
}

module.exports = { ReportService };
