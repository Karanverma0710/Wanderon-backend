const nodemailer = require('nodemailer');

class EmailConfig {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connected successfully');
    } catch (error) {
      console.error('Email service connection failed:', error.message);
    }
  }

  getTransporter() {
    return this.transporter;
  }

  getDefaultOptions() {
    return {
      from: {
        name: 'Auth System',
        address: process.env.EMAIL_FROM,
      },
    };
  }
}

const emailConfig = new EmailConfig();
module.exports = emailConfig;
