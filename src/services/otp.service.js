const prisma = require('../config/prisma');
const CryptoUtil = require('../utils/crypto.util');

class OTPService {
  async generateOTP(userId, email, type = 'verification') {
    await prisma.oTP.deleteMany({
      where: {
        email,
        type,
        isUsed: false,
      },
    });

    const code = CryptoUtil.generateOTP(parseInt(process.env.OTP_LENGTH));
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY));

    const otp = await prisma.oTP.create({
      data: {
        userId,
        email,
        code,
        type,
        expiresAt,
      },
    });

    return otp;
  }

  async verifyOTP(email, code, type = 'verification') {
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        code,
        type,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    if (CryptoUtil.isExpired(otp.expiresAt)) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { isUsed: true },
      });
      throw new Error('OTP has expired');
    }

    if (otp.attempts >= 5) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { isUsed: true },
      });
      throw new Error('Maximum verification attempts exceeded');
    }

    await prisma.oTP.update({
      where: { id: otp.id },
      data: {
        attempts: otp.attempts + 1,
      },
    });

    return otp;
  }

  async markOTPAsUsed(id) {
    return await prisma.oTP.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async cleanupExpiredOTPs() {
    const result = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  async getOTPsByUser(userId) {
    return await prisma.oTP.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async hasRecentOTP(email, type, minutes = 1) {
    const recentOTP = await prisma.oTP.findFirst({
      where: {
        email,
        type,
        createdAt: {
          gte: new Date(Date.now() - minutes * 60 * 1000),
        },
      },
    });
    return !!recentOTP;
  }
}

module.exports = new OTPService();
