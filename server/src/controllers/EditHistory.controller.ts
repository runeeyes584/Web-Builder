import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class EditHistoryController {
  // Lấy tất cả edit history của 1 page (cho Undo/Redo)
  static async getHistoryByPage(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageId } = req.params;
      const { limit = 50 } = req.query;

      const histories = await prisma.editHistory.findMany({
        where: { page_id: pageId },
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: histories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy edit history của 1 user
  static async getHistoryByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { clerkId } = req.params;
      const { limit = 50 } = req.query;

      const histories = await prisma.editHistory.findMany({
        where: { clerk_id: clerkId },
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        include: {
          page: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: histories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Lấy 1 history record cụ thể
  static async getHistoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const history = await prisma.editHistory.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          page: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!history) {
        return res.status(404).json({
          success: false,
          message: 'Edit history not found',
        });
      }

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // Tạo history record mới (khi user thực hiện hành động)
  static async createHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page_id, clerk_id, action, component_snapshot } = req.body;

      // Validate required fields
      if (!page_id || !clerk_id || !action || !component_snapshot) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: page_id, clerk_id, action, component_snapshot',
        });
      }

      // Validate action type
      const validActions = ['ADD', 'UPDATE', 'DELETE', 'DUPLICATE', 'MOVE'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        });
      }

      // Kiểm tra page tồn tại
      const page = await prisma.page.findUnique({
        where: { id: page_id },
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: 'Page not found',
        });
      }

      // Kiểm tra user tồn tại
      const user = await prisma.user.findUnique({
        where: { clerk_id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Tạo history record
      const history = await prisma.editHistory.create({
        data: {
          page_id,
          clerk_id,
          action,
          component_snapshot,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          page: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Edit history created successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa history cũ (cleanup - giữ lại X records gần nhất)
  static async cleanupOldHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageId } = req.params;
      const { keepLast = 100 } = req.body;

      // Lấy danh sách histories, skip N records đầu
      const historiesToDelete = await prisma.editHistory.findMany({
        where: { page_id: pageId },
        orderBy: { created_at: 'desc' },
        skip: Number(keepLast),
        select: { id: true },
      });

      if (historiesToDelete.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No old history to clean up',
          deleted: 0,
        });
      }

      // Xóa histories cũ
      const deleteResult = await prisma.editHistory.deleteMany({
        where: {
          id: {
            in: historiesToDelete.map(h => h.id),
          },
        },
      });

      res.status(200).json({
        success: true,
        message: `Cleaned up ${deleteResult.count} old history records`,
        deleted: deleteResult.count,
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa 1 history record cụ thể
  static async deleteHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const history = await prisma.editHistory.findUnique({
        where: { id },
      });

      if (!history) {
        return res.status(404).json({
          success: false,
          message: 'Edit history not found',
        });
      }

      await prisma.editHistory.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Edit history deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Xóa tất cả history của 1 page
  static async deleteAllHistoryByPage(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageId } = req.params;

      const deleteResult = await prisma.editHistory.deleteMany({
        where: { page_id: pageId },
      });

      res.status(200).json({
        success: true,
        message: `Deleted ${deleteResult.count} history records`,
        deleted: deleteResult.count,
      });
    } catch (error) {
      next(error);
    }
  }
}
