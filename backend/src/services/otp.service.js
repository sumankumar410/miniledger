const crypto = require('crypto');
const { env } = require('../config/env');
const { BadRequestError, TooManyRequestsError } = require('../utils/errors');

let twilioClient = null;
if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    console.log('📡 Twilio SMS service initialized.');
  } catch (err) {
    console.warn('⚠️ Twilio SDK init failed:', err.message);
  }
}

class OtpService {
  static otpStore = new Map();
  static rateLimitStore = new Map();

  // Configuration
  static OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  static MAX_VERIFICATION_ATTEMPTS = 3;
  static RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  static MAX_OTP_REQUESTS_PER_WINDOW = 3;
  static MIN_REQUEST_INTERVAL_MS = 30 * 1000; // 30 seconds cooldown between requests

  /**
   * Generates a secure 6-digit random OTP
   */
  static generateSecureOtp() {
    const randomInt = crypto.randomInt(100000, 1000000);
    return randomInt.toString();
  }

  /**
   * Checks rate limiting for OTP requests per phone number
   */
  static checkRateLimit(phoneNumber) {
    const now = Date.now();
    const record = this.rateLimitStore.get(phoneNumber);

    if (!record) {
      this.rateLimitStore.set(phoneNumber, {
        requestCount: 1,
        firstRequestedAt: now,
        lastRequestedAt: now,
      });
      return;
    }

    // Reset window if expired
    if (now - record.firstRequestedAt > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimitStore.set(phoneNumber, {
        requestCount: 1,
        firstRequestedAt: now,
        lastRequestedAt: now,
      });
      return;
    }

    // Check minimum interval between requests (30-second cooldown)
    if (now - record.lastRequestedAt < this.MIN_REQUEST_INTERVAL_MS) {
      const waitSeconds = Math.ceil(
        (this.MIN_REQUEST_INTERVAL_MS - (now - record.lastRequestedAt)) / 1000
      );
      throw new TooManyRequestsError(
        `Please wait ${waitSeconds} second(s) before requesting another OTP.`
      );
    }

    // Check max requests within window
    if (record.requestCount >= this.MAX_OTP_REQUESTS_PER_WINDOW) {
      const remainingMinutes = Math.ceil(
        (this.RATE_LIMIT_WINDOW_MS - (now - record.firstRequestedAt)) / 60000
      );
      throw new TooManyRequestsError(
        `OTP request limit reached. Please try again after ${remainingMinutes} minute(s).`
      );
    }

    record.requestCount += 1;
    record.lastRequestedAt = now;
    this.rateLimitStore.set(phoneNumber, record);
  }

  /**
   * Generates and stores OTP, prints to dev console, and dispatches SMS if Twilio is configured
   */
  static async sendOtp(phoneNumber) {
    this.checkRateLimit(phoneNumber);

    const otp = this.generateSecureOtp();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

    this.otpStore.set(phoneNumber, {
      otp,
      expiresAt,
      attempts: 0,
    });

    let twilioDispatched = false;

    // Dispatch real SMS via Twilio if configured
    if (twilioClient && env.TWILIO_PHONE_NUMBER) {
      try {
        const formattedTo = phoneNumber.startsWith('+')
          ? phoneNumber
          : `+91${phoneNumber.replace(/^0+/, '')}`;

        await twilioClient.messages.create({
          body: `[MiniLedger] Your verification code is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
          from: env.TWILIO_PHONE_NUMBER,
          to: formattedTo,
        });
        twilioDispatched = true;
        console.log(`📱 [TWILIO] Real SMS dispatched to ${formattedTo}`);
      } catch (smsErr) {
        console.warn(`⚠️ [TWILIO SMS NOTICE] Failed to send SMS via Twilio (${smsErr.message}). Falling back to terminal display.`);
      }
    }

    // Always log to development & test terminal
    if (env.NODE_ENV !== 'production' || !twilioDispatched) {
      console.log('====================================================');
      console.log(`📱 [MINILEDGER OTP] Phone: ${phoneNumber} | Code: ${otp}`);
      console.log(`⏳ Valid for 5 minutes`);
      console.log(`📡 Mode: ${twilioDispatched ? 'Twilio SMS & Terminal' : 'Terminal Base (Mock Console)'}`);
      console.log('====================================================');
    }

    return {
      expiresInSeconds: Math.floor(this.OTP_EXPIRY_MS / 1000),
      deliveredVia: twilioDispatched ? 'TWILIO_SMS' : 'TERMINAL_CONSOLE',
    };
  }

  /**
   * Verifies the provided OTP against the stored record
   */
  static verifyOtp(phoneNumber, submittedOtp) {
    const record = this.otpStore.get(phoneNumber);

    if (!record) {
      throw new BadRequestError('No OTP was requested for this phone number or it has expired.');
    }

    // Check if OTP has expired
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phoneNumber);
      throw new BadRequestError('The OTP has expired. Please request a new one.');
    }

    // Check attempt limit
    if (record.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      this.otpStore.delete(phoneNumber);
      throw new BadRequestError(
        'Maximum verification attempts exceeded. Please request a new OTP.'
      );
    }

    // Increment attempts
    record.attempts += 1;

    // Check match
    if (record.otp !== submittedOtp) {
      const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - record.attempts;
      if (remainingAttempts <= 0) {
        this.otpStore.delete(phoneNumber);
        throw new BadRequestError(
          'Maximum verification attempts exceeded. Please request a new OTP.'
        );
      }
      throw new BadRequestError(
        `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`
      );
    }

    // Success: remove consumed OTP
    this.otpStore.delete(phoneNumber);
    return true;
  }

  /**
   * Testing helper to inspect stored OTP in test environment
   */
  static _getStoredOtpForTest(phoneNumber) {
    const record = this.otpStore.get(phoneNumber);
    return record ? record.otp : null;
  }

  /**
   * Testing helper to reset all stores
   */
  static _resetStore() {
    this.otpStore.clear();
    this.rateLimitStore.clear();
  }
}

module.exports = { OtpService };
