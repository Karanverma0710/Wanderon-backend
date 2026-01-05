const TokenService = require('../services/token.service');
const UserService = require('../services/user.service');
const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/response.util');
const { asyncHandler } = require('../middlewares/error.middleware');

class OAuthController {
  googleCallback = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`
      );
    }

    const { accessToken, refreshToken } = await TokenService.generateAuthTokens(user);

    await UserService.updateLastLogin(user.id);

    JWTUtil.setTokenCookies(res, accessToken, refreshToken);

    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      provider: user.provider,
      avatar: user.avatar,
    }));

    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?success=true&user=${userData}&access_token=${accessToken}&refresh_token=${refreshToken}`
    );
  });

  googleCallbackJSON = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
      return ApiResponse.unauthorized(res, 'Google authentication failed');
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
          avatar: user.avatar,
          isVerified: user.isVerified,
          isActive: user.isActive,
          provider: user.provider,
        },
        accessToken,
        refreshToken,
      },
      'Google authentication successful'
    );
  });

  unlinkGoogle = asyncHandler(async (req, res) => {
    const user = await UserService.findUserById(req.user.id);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    if (!user.password) {
      return ApiResponse.error(
        res,
        'Cannot unlink Google account. Please set a password first',
        400
      );
    }

    if (user.provider === 'local') {
      return ApiResponse.conflict(res, 'Google account not linked');
    }

    await UserService.updateUser(user.id, {
      googleId: null,
      provider: 'local',
    });

    return ApiResponse.success(
      res,
      null,
      'Google account unlinked successfully'
    );
  });
}

module.exports = new OAuthController();
