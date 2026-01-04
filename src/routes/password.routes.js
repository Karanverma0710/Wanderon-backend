const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/password.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const ValidationSchemas = require('../utils/validation.util');

router.post(
  '/forgot',
  validateRequest(ValidationSchemas.forgotPassword),
  passwordController.forgotPassword
);

router.post(
  '/reset/:token',
  validateRequest(ValidationSchemas.resetPassword),
  passwordController.resetPassword
);

router.get(
  '/validate/:token',
  passwordController.validateResetToken
);

router.put(
  '/change',
  authenticate,
  validateRequest(ValidationSchemas.changePassword),
  passwordController.changePassword
);

module.exports = router;
