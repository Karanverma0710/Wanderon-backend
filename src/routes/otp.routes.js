const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const { validateRequest } = require('../middlewares/validate.middleware');
const ValidationSchemas = require('../utils/validation.util');

router.post(
  '/send',
  validateRequest(ValidationSchemas.sendOTP),
  otpController.sendOTP
);

router.post(
  '/verify',
  validateRequest(ValidationSchemas.verifyOTP),
  otpController.verifyOTP
);

router.post(
  '/resend',
  validateRequest(ValidationSchemas.sendOTP),
  otpController.resendOTP
);

module.exports = router;
