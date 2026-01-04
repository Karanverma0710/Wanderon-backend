const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const ValidationSchemas = require('../utils/validation.util');

router.post(
  '/register',
  validateRequest(ValidationSchemas.register),
  authController.register
);

router.post(
  '/login',
  validateRequest(ValidationSchemas.login),
  authController.login
);

router.post(
  '/logout',
  authController.logout
);

router.post(
  '/refresh',
  authController.refreshToken
);

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

module.exports = router;
