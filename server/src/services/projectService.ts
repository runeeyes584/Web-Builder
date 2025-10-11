import { prisma } from '../lib/prisma';

export class ProjectService {
  static async getProjectsByUserId(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async getProjectById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async createProject(data: {
    name: string;
    description?: string;
    userId: string;
    data?: any;
  }) {
    return prisma.project.create({
      data,
    });
  }

  static async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      data?: any;
    }
  ) {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  static async deleteProject(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  }
}