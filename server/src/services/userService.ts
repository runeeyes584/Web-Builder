import { prisma } from '../lib/prisma';

export class UserService {
  static async getAllUsers() {
    return prisma.user.findMany({
      include: {
        projects: true,
      },
    });
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });
  }

  static async createUser(data: { email: string; name?: string }) {
    return prisma.user.create({
      data,
    });
  }

  static async updateUser(id: string, data: { email?: string; name?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}