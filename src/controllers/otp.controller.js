const UserService = require('../services/user.service');
const OTPService = require('../services/otp.service');
const EmailService = require('../services/email.service');
const TokenService = require('../services/token.service');
const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/response.util');
const { asyncHandler } = require('../middlewares/error.middleware');

class OTPController {
  sendOTP = asyncHandler(async (req, res) => {
    const { email, type = 'verification' } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found with this email');
    }

    if (type === 'verification' && user.isVerified) {
      return ApiResponse.conflict(res, 'Email already verified');
    }

    const hasRecent = await OTPService.hasRecentOTP(email, type, 1);
    if (hasRecent) {
      return ApiResponse.error(
        res,
        'Please wait before requesting a new OTP',
        429
      );
    }

    const otp = await OTPService.generateOTP(user.id, email, type);

    await EmailService.sendOTPEmail(email, user.username, otp.code);

    return ApiResponse.success(
      res,
      { 
        email,
        expiresIn: Math.floor(parseInt(process.env.OTP_EXPIRY) / 60000),
      },
      'OTP sent successfully to your email'
    );
  });

  verifyOTP = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found with this email');
    }

    const otp = await OTPService.verifyOTP(email, code, 'verification');

    await OTPService.markOTPAsUsed(otp.id);

    await UserService.verifyUser(user.id);

    await EmailService.sendWelcomeEmail(user.email, user.username);

   const { accessToken, refreshToken } = await TokenService.generateAuthTokens(user);

    JWTUtil.setTokenCookies(res, accessToken, refreshToken);

    const updatedUser = await UserService.findUserById(user.id);

    return ApiResponse.success(
      res,
      { 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          isActive: updatedUser.isActive,
          provider: updatedUser.provider,
        },
      },
      'Email verified successfully'
    );
  });

  resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found with this email');
    }

    if (user.isVerified) {
      return ApiResponse.conflict(res, 'Email already verified');
    }

    const hasRecent = await OTPService.hasRecentOTP(email, 'verification', 1);
    if (hasRecent) {
      return ApiResponse.error(
        res,
        'Please wait at least 1 minute before requesting a new OTP',
        429
      );
    }

    const otp = await OTPService.generateOTP(user.id, email, 'verification');

    await EmailService.sendOTPEmail(email, user.username, otp.code);

    return ApiResponse.success(
      res,
      { 
        email,
        expiresIn: Math.floor(parseInt(process.env.OTP_EXPIRY) / 60000),
      },
      'OTP resent successfully'
    );
  });
}

module.exports = new OTPController();
