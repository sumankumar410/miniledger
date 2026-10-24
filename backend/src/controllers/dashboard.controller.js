const { DashboardService } = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class DashboardController {
  static async getSummary(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const summary = await DashboardService.getSummary(req.user.id);
      sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getUpcoming(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const upcoming = await DashboardService.getUpcoming(req.user.id);
      sendSuccess(res, upcoming, 'Upcoming payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getOverdue(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const overdue = await DashboardService.getOverdue(req.user.id);
      sendSuccess(res, overdue, 'Overdue loans retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getCalendarDueDates(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const calendar = await DashboardService.getCalendarDueDates(req.user.id);
      sendSuccess(res, calendar, 'Calendar due dates retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { DashboardController };
