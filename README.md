# Wanderon-backend
Authentication API - Backend

A secure REST API for user authentication with email verification, password management, and Google OAuth.

Features

User registration and login with JWT authentication

Email verification using OTP codes

Password reset via email links

Google OAuth integration

Refresh token rotation for security

Rate limiting on sensitive endpoints

Input sanitization and XSS protection

Quick Start

Install dependencies:
npm install
npx prisma generate
npm run dev

Server runs on http://localhost:5000

Environment Setup

Create a .env file with these variables:

NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/auth_db
FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=your_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=another_secret_key_minimum_32_characters
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d

COOKIE_SECRET=cookie_secret_minimum_32_characters
SESSION_SECRET=session_secret_minimum_32_characters

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@yourapp.com

OTP_EXPIRY=300000
RESET_TOKEN_EXPIRY=3600000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback

API Endpoints

Authentication:
POST /api/auth/register - Create new account
POST /api/auth/login - User login
POST /api/auth/logout - Logout current session
POST /api/auth/refresh - Refresh access token
GET /api/auth/me - Get current user info

Email Verification:
POST /api/otp/send - Send OTP to email
POST /api/otp/verify - Verify OTP code
POST /api/otp/resend - Resend OTP

Password Management:
POST /api/password/forgot - Request password reset
POST /api/password/reset/:token - Reset password with token
PUT /api/password/change - Change password (requires auth)

Google OAuth:
GET /api/oauth/google - Initiate Google login
GET /api/oauth/google/callback - Handle Google callback
DELETE /api/oauth/google/unlink - Unlink Google account

Security Features

Passwords hashed with bcrypt (12 rounds)

JWT tokens: 30-minute access + 7-day refresh

HTTP-only cookies with SameSite protection

Rate limiting prevents brute force attacks

MongoDB sanitization against injection

CORS configured for specific origins only

Gmail Setup for Emails

Enable 2-factor authentication on your Gmail

Go to App Passwords in Google Account settings

Generate a new app password

Use that password in SMTP_PASS variable

Google OAuth Setup

Visit Google Cloud Console

Create a new project

Enable Google+ API

Create OAuth 2.0 credentials

Add authorized redirect URI: http://localhost:5000/api/oauth/google/callback

Copy Client ID and Secret to your .env file

Production Deployment

Update these variables for production:
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database
GOOGLE_CALLBACK_URL=https://your-backend.koyeb.app/api/oauth/google/callback

The app works on any Node.js hosting platform like Heroku, Railway, Render, or Koyeb.
​

Available Scripts
npm run dev - Start development server with auto-reload
npm start - Start production server
npx prisma studio - Open database management GUI

Common Issues

Database won't connect: Verify MongoDB is running and DATABASE_URL is correct

Cookies not working in production: Make sure sameSite is set to 'none' and secure is true for cross-domain setup
​

Emails not sending: Use Gmail app password, not your regular password. Check SMTP settings are correct.

Project Structure
src/config - Database and Passport configuration
src/controllers - Handle incoming requests
src/middlewares - Authentication, validation, error handling
src/routes - Define API endpoints
src/services - Business logic for users, tokens, OTP
src/utils - Helper functions for JWT, validation, responses
prisma/schema.prisma - Database schema definition

Tech Stack
Node.js, Express, MongoDB, Prisma ORM, JWT, Bcrypt, Nodemailer, Passport.js
