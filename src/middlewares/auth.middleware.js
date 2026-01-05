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

    
    const user = await UserService.findUserById(decoded.userId || decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated');
    }

   
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      provider: user.provider,
    };

    next();
  } catch (error) {
   
    if (error.message === 'Access token expired' || error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED', 
      });
    }

    
    if (error.message === 'Invalid access token' || error.message.includes('invalid')) {
      return ApiResponse.unauthorized(res, 'Invalid token');
    }

    return ApiResponse.unauthorized(res, 'Authentication failed');
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
    const user = await UserService.findUserById(decoded.userId || decoded.id);

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        provider: user.provider,
      };
    }
  } catch (error) {
    console.log('Optional auth token error:', error.message);
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

const authenticateRefreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return ApiResponse.unauthorized(res, 'Refresh token required');
  }

  try {
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    const user = await UserService.findUserById(decoded.userId || decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      provider: user.provider,
    };

    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    if (error.message === 'Refresh token expired' || error.message.includes('expired')) {
      return ApiResponse.unauthorized(res, 'Refresh token expired. Please login again');
    }

    return ApiResponse.unauthorized(res, 'Invalid refresh token');
  }
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireVerified,
  checkOwnership,
  authenticateRefreshToken,
};
