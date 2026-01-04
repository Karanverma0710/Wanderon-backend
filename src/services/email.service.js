const fs = require('fs').promises;
const path = require('path');
const emailConfig = require('../config/email');

class EmailService {
  async sendEmail(to, subject, html) {
    const transporter = emailConfig.getTransporter();
    const defaultOptions = emailConfig.getDefaultOptions();

    const mailOptions = {
      ...defaultOptions,
      to,
      subject,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending failed:', error.message);
      throw new Error('Failed to send email');
    }
  }

  async loadTemplate(templateName, variables) {
    const templatePath = path.join(__dirname, '../templates', templateName);
    let template = await fs.readFile(templatePath, 'utf-8');

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key]);
    });

    return template;
  }

  async sendOTPEmail(email, username, otp) {
    const expiryMinutes = Math.floor(parseInt(process.env.OTP_EXPIRY) / 60000);

    const html = await this.loadTemplate('otp-email.html', {
      username,
      otp,
      expiryMinutes,
    });

    return await this.sendEmail(
      email,
      'Email Verification Code',
      html
    );
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const expiryHours = Math.floor(parseInt(process.env.RESET_TOKEN_EXPIRY) / 3600000);

    const html = await this.loadTemplate('reset-password.html', {
      username,
      resetLink,
      expiryHours,
    });

    return await this.sendEmail(
      email,
      'Password Reset Request',
      html
    );
  }

  async sendWelcomeEmail(email, username) {
    const loginLink = `${process.env.FRONTEND_URL}/login`;

    const html = await this.loadTemplate('welcome-email.html', {
      username,
      loginLink,
    });

    return await this.sendEmail(
      email,
      'Welcome to Auth System',
      html
    );
  }
}

module.exports = new EmailService();
