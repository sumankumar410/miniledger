const { NotificationService } = require('../services/notification.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class NotificationController {
  static async list(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await NotificationService.listNotifications(req.user.id);
      sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await NotificationService.markAsRead(req.user.id, req.params.id);
      sendSuccess(res, updated, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await NotificationService.markAllAsRead(req.user.id);
      sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { NotificationController };
