const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');

class NotificationService {
  /**
   * List notifications for user
   */
  static async listNotifications(userId) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(userId, notificationId) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notif) throw new NotFoundError('Notification not found');

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date().toISOString() },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date().toISOString() },
    });

    return { success: true };
  }

  /**
   * Create an in-app notification
   */
  static async createNotification(userId, data) {
    return await prisma.notification.create({
      data: {
        userId,
        loanId: data.loanId || null,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
      },
    });
  }
}

module.exports = { NotificationService };
