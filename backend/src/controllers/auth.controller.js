const { AuthService } = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const { UnauthorizedError } = require('../utils/errors');
const prisma = require('../config/db');

class AuthController {
  static async sendOtp(req, res, next) {
    try {
      const { phoneNumber, name, email } = req.body;
      const result = await AuthService.requestOtp(phoneNumber, { name, email });
      sendSuccess(res, result, 'OTP sent successfully. Check your terminal in development mode.');
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const { phoneNumber, otp, name, email } = req.body;
      const result = await AuthService.verifyOtp(phoneNumber, otp, { name, email });
      sendSuccess(res, result, 'Authentication successful', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });
      sendSuccess(res, user, 'Current user profile');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AuthController };
