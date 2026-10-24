const { ReminderService } = require('../services/reminder.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class ReminderController {
  static async getReminders(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const reminders = await ReminderService.getReminders(req.user.id);
      sendSuccess(res, reminders, 'Reminders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listScheduled(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const reminders = await ReminderService.listScheduledReminders(req.user.id);
      sendSuccess(res, reminders, 'Scheduled reminders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const reminder = await ReminderService.createReminder(req.user.id, req.body);
      sendSuccess(res, reminder, 'Reminder scheduled successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await ReminderService.updateReminder(req.user.id, req.params.id, req.body);
      sendSuccess(res, updated, 'Reminder updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await ReminderService.deleteReminder(req.user.id, req.params.id);
      sendSuccess(res, null, 'Reminder deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ReminderController };
