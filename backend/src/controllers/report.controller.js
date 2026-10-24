const { ReportService } = require('../services/report.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');

class ReportController {
  static async getMonthly(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const year = req.query.year || new Date().getFullYear();
      const monthly = await ReportService.getMonthlyBreakdown(req.user.id, year);
      sendSuccess(res, monthly, 'Monthly report retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFriends(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const friends = await ReportService.getFriendsReport(req.user.id);
      sendSuccess(res, friends, 'Friends report retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const type = req.query.type || 'loans';
      const friendId = req.query.friendId || null;

      const { filename, content } = await ReportService.generateCsvExport(req.user.id, type, friendId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(content);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ReportController };
