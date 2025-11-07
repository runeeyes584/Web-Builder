import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET all pages
export const getAllPages = async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clerk_id: true,
          },
        },
        components: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: pages,
      count: pages.length,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pages",
    });
  }
};

// GET pages by project_id
export const getPagesByProject = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: "project_id is required",
      });
    }

    const pages = await prisma.page.findMany({
      where: {
        project_id,
      },
      include: {
        components: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: pages,
      count: pages.length,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pages",
    });
  }
};

// GET single page by ID
export const getPageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clerk_id: true,
          },
        },
        components: true,
      },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page",
    });
  }
};

// POST create new page
export const createPage = async (req: Request, res: Response) => {
  try {
    const { project_id, name, json_structure } = req.body;

    // Validation
    if (!project_id || !name) {
      return res.status(400).json({
        success: false,
        message: "project_id and name are required",
      });
    }

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const page = await prisma.page.create({
      data: {
        project_id,
        name,
        json_structure: json_structure || {
          elements: [],
          version: "1.0.0",
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clerk_id: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Page created successfully",
      data: page,
    });
  } catch (error) {
    console.error("Error creating page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create page",
    });
  }
};

// PUT update page
export const updatePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, json_structure } = req.body;

    // Check if page exists
    const pageExists = await prisma.page.findUnique({
      where: { id },
    });

    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        name: name || pageExists.name,
        json_structure: json_structure || pageExists.json_structure,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clerk_id: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Page updated successfully",
      data: page,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update page",
    });
  }
};

// DELETE page
export const deletePage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if page exists
    const pageExists = await prisma.page.findUnique({
      where: { id },
    });

    if (!pageExists) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    // Delete all components first
    await prisma.component.deleteMany({
      where: { page_id: id },
    });

    // Delete page
    await prisma.page.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete page",
    });
  }
};
