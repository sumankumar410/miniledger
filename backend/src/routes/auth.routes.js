const { Router } = require('express');
const { AuthController } = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validate');
const { sendOtpSchema, verifyOtpSchema } = require('../schemas/auth.schema');
const { authenticate } = require('../middleware/auth');

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', validateRequest(sendOtpSchema), AuthController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', validateRequest(verifyOtpSchema), AuthController.verifyOtp);

// GET /api/auth/me
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
