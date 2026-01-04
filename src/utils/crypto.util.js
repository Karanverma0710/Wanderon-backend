const crypto = require('crypto');

class CryptoUtil {
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateSecureToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateRandomString(length = 16) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      result += characters[randomIndex];
    }
    
    return result;
  }

  static getOTPExpiry(minutes = 5) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static getTokenExpiry(hours = 1) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  static isExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
  }
}

module.exports = CryptoUtil;
