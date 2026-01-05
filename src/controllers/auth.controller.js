const UserService = require('../services/user.service');
const TokenService = require('../services/token.service');
const EmailService = require('../services/email.service');
const OTPService = require('../services/otp.service');
const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/response.util');
const { asyncHandler } = require('../middlewares/error.middleware');

class AuthController {
  register = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    const user = await UserService.createUser({
      email,
      username,
      password,
    });

    const otp = await OTPService.generateOTP(user.id, user.email, 'verification');

    await EmailService.sendOTPEmail(user.email, user.username, otp.code);

    return ApiResponse.success(
      res,
      { 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      'Registration successful. Please check your email for verification code',
      201
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (!user || !user.password) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Your account has been deactivated');
    }

    const isPasswordValid = await UserService.verifyPassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    if (!user.isVerified) {
      const otp = await OTPService.generateOTP(user.id, user.email, 'verification');
      await EmailService.sendOTPEmail(user.email, user.username, otp.code);
      
      return ApiResponse.forbidden(
        res,
        'Please verify your email. A new verification code has been sent'
      );
    }

    const { accessToken, refreshToken } = await TokenService.generateAuthTokens(user);

    await UserService.updateLastLogin(user.id);

    JWTUtil.setTokenCookies(res, accessToken, refreshToken);

     return ApiResponse.success(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          provider: user.provider,
          avatar: user.avatar,
        },
      },
      'Login successful'
    );
  });

  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      try {
        await TokenService.revokeRefreshToken(refreshToken);
      } catch (error) {
        console.error('Token revocation error:', error.message);
      }
    }

    JWTUtil.clearTokenCookies(res);

    return ApiResponse.success(res, null, 'Logout successful');
  });

 refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return ApiResponse.unauthorized(res, 'Refresh token required');
    }

    const { accessToken, refreshToken: newRefreshToken, user } = 
      await TokenService.refreshAccessToken(refreshToken);

    JWTUtil.setTokenCookies(res, accessToken, newRefreshToken);

    return ApiResponse.success(
      res,
      { 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          provider: user.provider,
          avatar: user.avatar,
        }
      },
      'Token refreshed successfully'
    );
  });

  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await UserService.findUserById(req.user.id);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(
      res, 
      { 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          provider: user.provider,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        }
      }, 
      'User retrieved successfully'
    );
  });

  logoutAll = asyncHandler(async (req, res) => {
    await TokenService.revokeAllUserTokens(req.user.id);

    JWTUtil.clearTokenCookies(res);

    return ApiResponse.success(
      res,
      null,
      'Logged out from all devices successfully'
    );
  });
}

module.exports = new AuthController();
