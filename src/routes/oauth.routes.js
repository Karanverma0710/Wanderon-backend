const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const oauthController = require('../controllers/oauth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
  }),
  oauthController.googleCallback
);

router.get(
  '/google/callback/json',
  passport.authenticate('google', { 
    failureRedirect: false,
    session: false,
  }),
  oauthController.googleCallbackJSON
);

router.delete(
  '/google/unlink',
  authenticate,
  oauthController.unlinkGoogle
);

module.exports = router;
