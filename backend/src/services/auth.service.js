const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const prisma = require('../config/db');
const { OtpService } = require('./otp.service');

class AuthService {
  /**
   * Request an OTP for a given phone number
   */
  static async requestOtp(phoneNumber, userData = {}) {
    const result = await OtpService.sendOtp(phoneNumber);
    return {
      message: result.deliveredVia === 'TWILIO_SMS'
        ? 'OTP has been dispatched to your mobile number via SMS.'
        : 'OTP has been generated. Check your development terminal.',
      expiresInSeconds: result.expiresInSeconds,
      deliveredVia: result.deliveredVia,
    };
  }

  /**
   * Verifies the OTP, registers or retrieves user, and returns signed JWT
   */
  static async verifyOtp(phoneNumber, otp, userData = {}) {
    // 1. Verify OTP with attempt and expiry checks
    OtpService.verifyOtp(phoneNumber, otp);

    // 2. Prepare user update or create details
    const updateData = {};
    if (userData.name) updateData.name = userData.name.trim();
    if (userData.email) updateData.email = userData.email.trim();

    // 3. Find or create the user in database
    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: updateData,
      create: {
        phoneNumber,
        name: userData.name ? userData.name.trim() : null,
        email: userData.email ? userData.email.trim() : null,
      },
    });

    // 4. Sign JWT
    const token = jwt.sign(
      {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name || null,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name || null,
        email: user.email || null,
        createdAt: user.createdAt,
      },
    };
  }
}

module.exports = { AuthService };
