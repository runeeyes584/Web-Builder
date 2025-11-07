import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET all projects
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

// GET projects by clerk_id (user's projects) - LOAD PROJECTS
export const getProjectsByUser = async (req: Request, res: Response) => {
  try {
    const { clerk_id } = req.params;

    if (!clerk_id) {
      return res.status(400).json({
        success: false,
        message: "clerk_id is required",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        clerk_id,
      },
      include: {
        pages: {
          select: {
            id: true,
            name: true,
            json_structure: true,
            updated_at: true,
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
    console.error("Error fetching user projects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user projects",
    });
  }
};

// GET single project by ID - LOAD SPECIFIC PROJECT
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
          include: {
            components: true,
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

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

// POST create new project (SAVE PROJECT)
export const createProject = async (req: Request, res: Response) => {
  try {
    const { clerk_id, name, description, elements } = req.body;

    // Validation
    if (!clerk_id || !name) {
      return res.status(400).json({
        success: false,
        message: "clerk_id and name are required",
      });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { clerk_id },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create project with default page
    const project = await prisma.project.create({
      data: {
        clerk_id,
        name,
        description: description || "",
        pages: {
          create: {
            name: "Main Page",
            json_structure: {
              elements: elements || [],
              version: "1.0.0",
              createdAt: new Date().toISOString(),
            },
          },
        },
      },
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
        pages: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

// PUT update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, elements } = req.body;

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id },
      include: {
        pages: true,
      },
    });

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name || projectExists.name,
        description: description !== undefined ? description : projectExists.description,
      },
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
        pages: true,
      },
    });

    // Update page elements if provided
    if (elements && projectExists.pages.length > 0) {
      const mainPage = projectExists.pages[0];
      await prisma.page.update({
        where: { id: mainPage.id },
        data: {
          json_structure: {
            elements: elements,
            version: "1.0.0",
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// DELETE project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id },
    });

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Delete all pages first (cascade)
    await prisma.page.deleteMany({
      where: { project_id: id },
    });

    // Delete project
    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};
