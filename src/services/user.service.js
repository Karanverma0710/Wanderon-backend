const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

class UserService {
  async createUser(data) {
    const { email, username, password } = data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        provider: 'local',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findUserByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        provider: true,
        createdAt: true,
        lastLogin: true,
      },
    });
  }

  async findUserByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        isVerified: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async verifyUser(id) {
    return await prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async deactivateUser(id) {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteUser(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async getUserStats(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            otps: true,
            refreshTokens: true,
            passwordResets: true,
          },
        },
      },
    });
    return user;
  }
}

module.exports = new UserService();
