const { z } = require('zod');

const phoneRegex = /^\+?[1-9]\d{9,14}$/;

const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, {
        message: 'Phone number must be a valid 10-15 digit number (e.g. 9876543210 or +919876543210)',
      }),
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).optional(),
    email: z.string().trim().email({ message: 'Invalid email address' }).optional(),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, {
        message: 'Phone number must be a valid 10-15 digit number (e.g. 9876543210 or +919876543210)',
      }),
    otp: z
      .string({ required_error: 'OTP is required' })
      .trim()
      .length(6, { message: 'OTP must be exactly 6 digits' })
      .regex(/^\d{6}$/, { message: 'OTP must contain numbers only' }),
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
  }),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
};
