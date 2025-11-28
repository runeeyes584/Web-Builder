import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/admin/users - Get all users with their projects count
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        });

        // Transform data to include projects count
        const usersWithCount = users.map((user) => ({
            id: user.id,
            clerk_id: user.clerk_id,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_deleted: user.is_deleted,
            created_at: user.created_at,
            updated_at: user.updated_at,
            projectsCount: user._count.projects,
        }));

        return res.status(200).json({
            success: true,
            data: usersWithCount,
            count: usersWithCount.length,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

// GET /api/admin/users/:id - Get user details with all projects
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                projects: {
                    include: {
                        pages: {
                            select: {
                                id: true,
                                name: true,
                                updated_at: true,
                            },
                        },
                    },
                    orderBy: {
                        updated_at: "desc",
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
};

// DELETE /api/admin/users/:id - Delete user and all their projects
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                projects: {
                    include: {
                        pages: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Soft delete the user
        await prisma.user.update({
            where: { id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
        });

        return res.status(200).json({
            success: true,
            message: "User has been deactivated successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// POST /api/admin/users/:id/restore - Restore a soft-deleted user
export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await prisma.user.update({
            where: { id },
            data: {
                is_deleted: false,
                deleted_at: null,
            },
        });

        return res.status(200).json({
            success: true,
            message: "User has been restored successfully",
        });
    } catch (error) {
        console.error("Error restoring user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to restore user",
        });
    }
};

// GET /api/admin/stats - Get dashboard statistics
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        // Get total users count
        const totalUsers = await prisma.user.count();

        // Get total projects count
        const totalProjects = await prisma.project.count();

        // Get active projects (updated in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeProjects = await prisma.project.count({
            where: {
                updated_at: {
                    gte: sevenDaysAgo,
                },
            },
        });

        // Get new users (created this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newUsers = await prisma.user.count({
            where: {
                created_at: {
                    gte: startOfMonth,
                },
            },
        });

        // Get public projects count
        const publicProjects = await prisma.project.count({
            where: {
                is_public: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProjects,
                activeProjects,
                newUsers,
                publicProjects,
            },
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
        });
    }
};

// GET /api/admin/projects - Get all projects (alias to existing endpoint)
export const getAllProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                pages: {
                    select: {
                        id: true,
                        name: true,
                        updated_at: true,
                    },
                },
                _count: {
                    select: {
                        pages: true,
                    },
                },
            },
            orderBy: {
                updated_at: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: projects,
            count: projects.length,
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
        });
    }
};

// GET /api/admin/projects/:id - Get project details
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                pages: {
                    select: {
                        id: true,
                        name: true,
                        created_at: true,
                        updated_at: true,
                    },
                    orderBy: {
                        updated_at: "desc",
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Fetch collaborators separately
        const collaborators = await prisma.projectCollaborator.findMany({
            where: { project_id: id },
            select: {
                id: true,
                role: true,
                clerk_id: true,
                added_at: true,
            },
        });

        // Fetch collaborator user details
        const collaboratorClerkIds = collaborators.map((c: any) => c.clerk_id);
        const collaboratorUsers = await prisma.user.findMany({
            where: {
                clerk_id: { in: collaboratorClerkIds },
            },
            select: {
                id: true,
                clerk_id: true,
                email: true,
                first_name: true,
                last_name: true,
            },
        });

        // Merge collaborator data with user info
        const collaboratorsWithUsers = collaborators.map((collab: any) => {
            const user = collaboratorUsers.find((u: any) => u.clerk_id === collab.clerk_id);
            return {
                ...collab,
                user,
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                ...project,
                collaborators: collaboratorsWithUsers,
            },
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch project",
        });
    }
};

