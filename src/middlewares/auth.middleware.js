const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/response.util');
const UserService = require('../services/user.service');
const { asyncHandler } = require('./error.middleware');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization) {
    token = JWTUtil.getTokenFromHeader(req.headers.authorization);
  }

  if (!token) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  try {
    const decoded = JWTUtil.verifyAccessToken(token);

    const user = await UserService.findUserById(decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.message.includes('expired')) {
      return ApiResponse.unauthorized(res, 'Token expired, please login again');
    }
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        'You do not have permission to perform this action'
      );
    }

    next();
  };
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization) {
    token = JWTUtil.getTokenFromHeader(req.headers.authorization);
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = JWTUtil.verifyAccessToken(token);
    const user = await UserService.findUserById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }

  next();
});

const requireVerified = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required');
  }

  if (!req.user.isVerified) {
    return ApiResponse.forbidden(
      res,
      'Please verify your email address to access this resource'
    );
  }

  next();
};

const checkOwnership = (resourceKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const resourceId = req.params[resourceKey] || req.body[resourceKey];

    if (req.user.role === 'admin') {
      return next();
    }

    if (resourceId !== req.user.id) {
      return ApiResponse.forbidden(
        res,
        'You can only access your own resources'
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireVerified,
  checkOwnership,
};
