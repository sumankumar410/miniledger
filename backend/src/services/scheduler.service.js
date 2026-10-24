const cron = require('node-cron');
const prisma = require('../config/db');
const { NotificationService } = require('./notification.service');
const { formatMoney } = require('../utils/decimal');

class SchedulerService {
  static task = null;

  /**
   * Run one pass of reminder and overdue checks
   */
  static async runCheck() {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // 1. Process Pending Scheduled Reminders
      const pendingReminders = await prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          reminderDateTime: { lte: now },
        },
      });

      for (const reminder of pendingReminders) {
        const loan = await prisma.loan.findFirst({
          where: { id: reminder.loanId },
        });

        const friendName = loan ? loan.friendName : 'friend';
        const amount = loan ? formatMoney(loan.remainingBalance || loan.amount) : '';

        await NotificationService.createNotification(reminder.userId, {
          loanId: reminder.loanId,
          title: 'Scheduled Reminder',
          message: reminder.notes || `Reminder regarding ₹${amount} with ${friendName}.`,
          type: 'REMINDER',
        });

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: now.toISOString(),
          },
        });
      }

      // 2. Check Due Today and Overdue Loans for In-App Notifications
      const activeLoans = await prisma.loan.findMany({
        where: { isRepaid: false },
      });

      for (const loan of activeLoans) {
        if (!loan.dueDate) continue;

        const due = new Date(loan.dueDate);
        const dueStr = due.toISOString().split('T')[0];
        const isLent = loan.type === 'LENT';
        const bal = formatMoney(loan.remainingBalance || loan.amount);

        // Due Today
        if (dueStr === todayStr) {
          const title = `Loan Due Today: ${loan.friendName}`;
          const existing = await prisma.notification.findMany({
            where: { userId: loan.userId, loanId: loan.id, title },
          });

          if (existing.length === 0) {
            await NotificationService.createNotification(loan.userId, {
              loanId: loan.id,
              title,
              message: isLent
                ? `${loan.friendName} is scheduled to repay ₹${bal} today.`
                : `You are scheduled to repay ₹${bal} to ${loan.friendName} today.`,
              type: 'DUE_TODAY',
            });
          }
        }
      }
    } catch (err) {
      console.error('Error running reminder scheduler pass:', err.message);
    }
  }

  /**
   * Start cron job (runs every hour in production)
   */
  static start(cronSchedule = '0 * * * *') {
    if (this.task) return;
    this.task = cron.schedule(cronSchedule, () => {
      this.runCheck();
    });
    console.log('⏰ Reminder background scheduler initialized.');
  }

  /**
   * Stop cron job
   */
  static stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }
}

module.exports = { SchedulerService };
