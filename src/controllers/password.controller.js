const UserService = require('../services/user.service');
const TokenService = require('../services/token.service');
const EmailService = require('../services/email.service');
const ApiResponse = require('../utils/response.util');
const { asyncHandler } = require('../middlewares/error.middleware');

class PasswordController {
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return ApiResponse.success(
        res,
        null,
        'If the email exists, a password reset link has been sent'
      );
    }

    if (!user.password) {
      return ApiResponse.error(
        res,
        'This account uses social login. Password reset is not available',
        400
      );
    }

    const resetToken = await TokenService.createPasswordResetToken(
      user.id,
      user.email
    );

    await EmailService.sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken.token
    );

    return ApiResponse.success(
      res,
      null,
      'If the email exists, a password reset link has been sent'
    );
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const resetToken = await TokenService.verifyPasswordResetToken(token);

    const user = await UserService.findUserByEmail(resetToken.email);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    await UserService.updatePassword(user.id, password);

    await TokenService.markResetTokenAsUsed(token);

    await TokenService.revokeAllUserTokens(user.id);

    return ApiResponse.success(
      res,
      null,
      'Password reset successful. Please login with your new password'
    );
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await UserService.findUserById(req.user.id);

    if (!user || !user.password) {
      return ApiResponse.error(
        res,
        'This account uses social login. Password change is not available',
        400
      );
    }

    const isPasswordValid = await UserService.verifyPassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, 'Current password is incorrect');
    }

    await UserService.updatePassword(user.id, newPassword);

    await TokenService.revokeAllUserTokens(user.id);

    return ApiResponse.success(
      res,
      null,
      'Password changed successfully. Please login again with your new password'
    );
  });

  validateResetToken = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const resetToken = await TokenService.verifyPasswordResetToken(token);

    return ApiResponse.success(
      res,
      { 
        valid: true,
        email: resetToken.email,
      },
      'Reset token is valid'
    );
  });
}

module.exports = new PasswordController();
