const prisma = require('../config/db');
const { formatMoney } = require('../utils/decimal');

class ReminderService {
  static async getReminders(userId) {
    const loans = await prisma.loan.findMany({
      where: { userId, isRepaid: false },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const buckets = {
      overdue: [],
      dueToday: [],
      dueTomorrow: [],
      dueWithin7Days: [],
      upcomingThisMonth: [],
      noDueDate: [],
    };

    loans.forEach((loan) => {
      const formatted = {
        ...loan,
        amount: formatMoney(loan.amount),
        remainingBalance: formatMoney(loan.remainingBalance || loan.amount),
      };

      if (!loan.dueDate) {
        buckets.noDueDate.push(formatted);
        return;
      }

      const due = new Date(loan.dueDate);
      const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      if (dueMidnight < today) {
        const daysOverdue = Math.ceil((today.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24));
        buckets.overdue.push({ ...formatted, daysOverdue });
      } else if (dueMidnight.getTime() === today.getTime()) {
        buckets.dueToday.push(formatted);
      } else if (dueMidnight.getTime() === tomorrow.getTime()) {
        buckets.dueTomorrow.push(formatted);
      } else if (dueMidnight <= sevenDays) {
        const daysRemaining = Math.ceil((dueMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        buckets.dueWithin7Days.push({ ...formatted, daysRemaining });
      } else if (dueMidnight <= thirtyDays) {
        const daysRemaining = Math.ceil((dueMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        buckets.upcomingThisMonth.push({ ...formatted, daysRemaining });
      }
    });

    return buckets;
  }

  /**
   * Create a scheduled reminder
   */
  static async createReminder(userId, data) {
    if (!data.loanId) throw new Error('Loan ID is required');
    if (!data.reminderDateTime) throw new Error('Reminder date time is required');

    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, userId },
    });
    if (!loan) throw new Error('Loan not found');

    return await prisma.reminder.create({
      data: {
        userId,
        loanId: data.loanId,
        reminderDateTime: new Date(data.reminderDateTime).toISOString(),
        reminderType: data.reminderType || 'DUE_DATE',
        channel: data.channel || 'IN_APP',
        status: 'PENDING',
        notes: data.notes?.trim() || null,
      },
    });
  }

  /**
   * List scheduled reminders for user
   */
  static async listScheduledReminders(userId) {
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { reminderDateTime: 'asc' },
    });

    const loans = await prisma.loan.findMany({ where: { userId } });

    return reminders.map((r) => {
      const loan = loans.find((l) => l.id === r.loanId);
      return {
        ...r,
        friendName: loan ? loan.friendName : 'Friend',
        loanAmount: loan ? formatMoney(loan.amount) : '0.00',
        remainingBalance: loan ? formatMoney(loan.remainingBalance || loan.amount) : '0.00',
      };
    });
  }

  /**
   * Update a scheduled reminder
   */
  static async updateReminder(userId, reminderId, data) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId },
    });
    if (!reminder) throw new Error('Reminder not found');

    return await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        reminderDateTime: data.reminderDateTime ? new Date(data.reminderDateTime).toISOString() : reminder.reminderDateTime,
        channel: data.channel || reminder.channel,
        status: data.status || reminder.status,
        notes: data.notes !== undefined ? data.notes : reminder.notes,
      },
    });
  }

  /**
   * Delete a scheduled reminder
   */
  static async deleteReminder(userId, reminderId) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId },
    });
    if (!reminder) throw new Error('Reminder not found');

    return await prisma.reminder.delete({
      where: { id: reminderId },
    });
  }
}

module.exports = { ReminderService };
