const prisma = require('../config/prisma');
const JWTUtil = require('../utils/jwt.util');
const CryptoUtil = require('../utils/crypto.util');

class TokenService {
  async generateAuthTokens(user) {
    const payload = {
      userId: user.id, 
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = JWTUtil.generateAccessToken(payload);
    const refreshToken = JWTUtil.generateRefreshToken({ userId: user.id }); 

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token) {
    const decoded = JWTUtil.verifyRefreshToken(token);

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      throw new Error('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new Error('Refresh token has been revoked');
    }

    if (CryptoUtil.isExpired(refreshToken.expiresAt)) {
      throw new Error('Refresh token expired');
    }

    return decoded;
  }

  async refreshAccessToken(refreshToken) {
    const decoded = await this.verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }, 
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatar: true,
        provider: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const payload = {
      userId: user.id, 
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = JWTUtil.generateAccessToken(payload);

    const newRefreshToken = JWTUtil.generateRefreshToken({ userId: user.id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt,
      },
    });

    return { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken,
      user 
    };
  }

  async revokeRefreshToken(token) {
    try {
      return await prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });
    } catch (error) {
      console.log('Token revocation failed:', error.message);
    }
  }

  async revokeAllUserTokens(userId) {
    return await prisma.refreshToken.updateMany({
      where: { 
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            isRevoked: true,
          },
        ],
      },
    });
    return result.count;
  }

  async createPasswordResetToken(userId, email) {
    await prisma.passwordReset.deleteMany({
      where: {
        email,
        isUsed: false,
      },
    });

    const token = CryptoUtil.generateToken(32);
    const expiresAt = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY));

    const resetToken = await prisma.passwordReset.create({
      data: {
        userId,
        email,
        token,
        expiresAt,
      },
    });

    return resetToken;
  }

  async verifyPasswordResetToken(token) {
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    if (resetToken.isUsed) {
      throw new Error('Reset token already used');
    }

    if (CryptoUtil.isExpired(resetToken.expiresAt)) {
      throw new Error('Reset token has expired');
    }

    return resetToken;
  }

  async markResetTokenAsUsed(token) {
    return await prisma.passwordReset.update({
      where: { token },
      data: { isUsed: true },
    });
  }
}

module.exports = new TokenService();
