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

    // Get projects owned by user
    const ownedProjects = await prisma.project.findMany({
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

    // Get projects where user is a collaborator (shared projects)
    const sharedProjectsData = await prisma.projectCollaborator.findMany({
      where: {
        clerk_id,
      },
      include: {
        project: {
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
        },
      },
    });

    // Map shared projects to match the structure
    const sharedProjects = sharedProjectsData.map((collab) => ({
      ...collab.project,
      userRole: collab.role,
      isShared: true,
    }));

    // Combine owned and shared projects
    const allProjects = [
      ...ownedProjects.map(p => ({ ...p, userRole: 'owner', isShared: false })),
      ...sharedProjects,
    ];

    // Sort by updated_at desc
    allProjects.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return res.status(200).json({
      success: true,
      data: allProjects,
      count: allProjects.length,
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
    const { clerk_id, name, description, elements, layout, pages } = req.body;

    // Validation
    if (!clerk_id || !name) {
      return res.status(400).json({
        success: false,
        message: "clerk_id and name are required",
      });
    }

    // Validate layout structure if provided
    if (layout) {
      if (typeof layout.headerHeight !== 'number' || layout.headerHeight < 48) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: headerHeight must be a number >= 48",
        });
      }
      if (typeof layout.footerHeight !== 'number' || layout.footerHeight < 48) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: footerHeight must be a number >= 48",
        });
      }
      if (!Array.isArray(layout.sections) || layout.sections.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: sections must be a non-empty array",
        });
      }
      // Validate each section
      const sectionIds = new Set<string>();
      for (const section of layout.sections) {
        if (!section.id || typeof section.id !== 'string') {
          return res.status(400).json({
            success: false,
            message: "Invalid layout: each section must have a string id",
          });
        }
        if (sectionIds.has(section.id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid layout: duplicate section id "${section.id}"`,
          });
        }
        sectionIds.add(section.id);
        if (typeof section.height !== 'number' || section.height < 128) {
          return res.status(400).json({
            success: false,
            message: `Invalid layout: section "${section.id}" height must be a number >= 128`,
          });
        }
      }
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

    // Prepare pages data - support both multi-page and legacy single-page format
    let pagesData: any[] = [];
    
    if (pages && Array.isArray(pages) && pages.length > 0) {
      // Multi-page format: use provided pages array
      pagesData = pages.map((page: any, index: number) => {
        const jsonStructure: any = {
          elements: page.elements || [],
          version: "1.0.0",
          createdAt: new Date().toISOString(),
        };
        
        // Include layout if provided
        if (page.layout) {
          jsonStructure.layout = page.layout;
        }
        
        // Include metadata if provided
        if (page.metadata) {
          jsonStructure.metadata = page.metadata;
        }
        
        return {
          name: page.name || `Page ${index + 1}`,
          json_structure: jsonStructure,
        };
      });
    } else {
      // Legacy single-page format: create one page with provided elements/layout
      const jsonStructure: any = {
        elements: elements || [],
        version: "1.0.0",
        createdAt: new Date().toISOString(),
      };
      
      // Include layout if provided and valid
      if (layout) {
        jsonStructure.layout = {
          headerHeight: layout.headerHeight,
          footerHeight: layout.footerHeight,
          sections: layout.sections.map((s: any) => ({ id: s.id, height: s.height })),
        };
      }
      
      pagesData = [{
        name: "Main Page",
        json_structure: jsonStructure,
      }];
    }

    // Create project with pages
    const project = await prisma.project.create({
      data: {
        clerk_id,
        name,
        description: description || "",
        pages: {
          create: pagesData,
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
    const { name, description, elements, layout, pages, is_public } = req.body;

    // Validate layout structure if provided
    if (layout) {
      if (typeof layout.headerHeight !== 'number' || layout.headerHeight < 48) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: headerHeight must be a number >= 48",
        });
      }
      if (typeof layout.footerHeight !== 'number' || layout.footerHeight < 48) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: footerHeight must be a number >= 48",
        });
      }
      if (!Array.isArray(layout.sections) || layout.sections.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid layout: sections must be a non-empty array",
        });
      }
      // Validate each section
      const sectionIds = new Set<string>();
      for (const section of layout.sections) {
        if (!section.id || typeof section.id !== 'string') {
          return res.status(400).json({
            success: false,
            message: "Invalid layout: each section must have a string id",
          });
        }
        if (sectionIds.has(section.id)) {
          return res.status(400).json({
            success: false,
            message: `Invalid layout: duplicate section id "${section.id}"`,
          });
        }
        sectionIds.add(section.id);
        if (typeof section.height !== 'number' || section.height < 128) {
          return res.status(400).json({
            success: false,
            message: `Invalid layout: section "${section.id}" height must be a number >= 128`,
          });
        }
      }
    }

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

    // Update project basic info
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name || projectExists.name,
        description: description !== undefined ? description : projectExists.description,
        is_public: is_public !== undefined ? is_public : projectExists.is_public,
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

    // Handle pages update - support both multi-page and legacy single-page format
    if (pages && Array.isArray(pages) && pages.length > 0) {
      // Multi-page update: update/create/delete pages as needed
      
      // Get existing page IDs
      const existingPageIds = projectExists.pages.map(p => p.id);
      const incomingPageIds = pages.map((p: any) => p.id).filter(Boolean);
      
      // Delete pages that are no longer in the incoming data
      const pagesToDelete = existingPageIds.filter(id => !incomingPageIds.includes(id));
      if (pagesToDelete.length > 0) {
        await prisma.page.deleteMany({
          where: {
            id: { in: pagesToDelete },
            project_id: id,
          },
        });
      }
      
      // Update or create pages
      for (const pageData of pages) {
        const jsonStructure: any = {
          elements: pageData.elements || [],
          version: "1.0.0",
          updatedAt: new Date().toISOString(),
        };
        
        // Include layout if provided
        if (pageData.layout) {
          jsonStructure.layout = pageData.layout;
        }
        
        // Include metadata if provided
        if (pageData.metadata) {
          jsonStructure.metadata = pageData.metadata;
        }
        
        if (pageData.id && existingPageIds.includes(pageData.id)) {
          // Update existing page
          await prisma.page.update({
            where: { id: pageData.id },
            data: {
              name: pageData.name,
              json_structure: jsonStructure,
            },
          });
        } else {
          // Create new page
          await prisma.page.create({
            data: {
              project_id: id,
              name: pageData.name || "New Page",
              json_structure: jsonStructure,
            },
          });
        }
      }
    } else if ((elements !== undefined || layout !== undefined) && projectExists.pages.length > 0) {
      // Legacy single-page update: update the first page only
      const mainPage = projectExists.pages[0];
      const currentStructure = mainPage.json_structure as any;
      
      // Build updated json_structure
      const updatedStructure: any = {
        elements: elements !== undefined ? elements : (currentStructure.elements || []),
        version: "1.0.0",
        updatedAt: new Date().toISOString(),
      };
      
      // Handle layout: use provided layout, or preserve existing, or omit if neither exists
      if (layout !== undefined) {
        // New layout provided - use it
        updatedStructure.layout = {
          headerHeight: layout.headerHeight,
          footerHeight: layout.footerHeight,
          sections: layout.sections.map((s: any) => ({ id: s.id, height: s.height })),
        };
      } else if (currentStructure.layout) {
        // No new layout, but preserve existing layout
        updatedStructure.layout = currentStructure.layout;
      }
      // If neither layout provided nor existing layout, don't include layout field
      
      await prisma.page.update({
        where: { id: mainPage.id },
        data: {
          json_structure: updatedStructure,
        },
      });
    }

    // Re-fetch the project with updated pages to return fresh data
    const updatedProject = await prisma.project.findUnique({
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
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error("Error updating project:", {
      error: error.message || error,
      code: error.code,
      name: error.name,
      // Check if it's a payload size issue
      isPayloadError: error.message?.includes('document') || error.message?.includes('size') || error.message?.includes('limit'),
    });
    
    // Check for MongoDB document size limit (16MB)
    if (error.message?.includes('document exceeds maximum allowed bson size') || 
        error.message?.includes('BSONObjectTooLarge') ||
        error.code === 10334) {
      return res.status(413).json({
        success: false,
        message: "Project data is too large. Please reduce the size of images or remove some elements. Consider uploading images to cloud storage instead of embedding them.",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
      include: {
        pages: {
          select: { id: true }
        }
      }
    });

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Get all page IDs for this project
    const pageIds = projectExists.pages.map(page => page.id);

    // Delete in correct order to avoid foreign key constraints:
    
    // 1. Delete edit histories for all pages
    if (pageIds.length > 0) {
      await prisma.editHistory.deleteMany({
        where: { page_id: { in: pageIds } },
      });
    }

    // 2. Delete components for all pages
    if (pageIds.length > 0) {
      await prisma.component.deleteMany({
        where: { page_id: { in: pageIds } },
      });
    }

    // 3. Delete all pages
    await prisma.page.deleteMany({
      where: { project_id: id },
    });

    // 4. Delete exports for this project
    await prisma.export.deleteMany({
      where: { project_id: id },
    });

    // 5. Delete active sessions for this project
    await prisma.activeSession.deleteMany({
      where: { project_id: id },
    });

    // 6. Delete project collaborators (has cascade in schema, but delete explicitly for safety)
    await prisma.projectCollaborator.deleteMany({
      where: { project_id: id },
    });

    // 7. Delete project invitations (has cascade in schema, but delete explicitly for safety)
    await prisma.projectInvitation.deleteMany({
      where: { project_id: id },
    });

    // 8. Finally, delete the project itself
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
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET user's role for a specific project
export const getUserRole = async (req: Request, res: Response) => {
  try {
    const { projectId, clerkId } = req.params;

    console.log('🔍 getUserRole called - projectId:', projectId, 'clerkId:', clerkId);

    if (!projectId || !clerkId) {
      return res.status(400).json({
        success: false,
        message: "projectId and clerkId are required",
      });
    }

    // Check if user is the project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clerk_id: true },
    });

    console.log('📦 Project found:', project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // If user is the owner, return OWNER role
    if (project.clerk_id === clerkId) {
      console.log('👑 User is OWNER');
      return res.status(200).json({
        success: true,
        role: "OWNER",
      });
    }

    // Check if user is a collaborator
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        project_id_clerk_id: {
          project_id: projectId,
          clerk_id: clerkId,
        },
      },
      select: { role: true },
    });

    console.log('👥 Collaborator found:', collaborator);

    if (!collaborator) {
      console.log('❌ User has no access');
      return res.status(403).json({
        success: false,
        message: "User does not have access to this project",
      });
    }

    // Convert role to UPPERCASE to match frontend expectations
    const role = collaborator.role.toUpperCase();
    console.log('✅ Returning role:', role);
    return res.status(200).json({
      success: true,
      role: role, // Returns 'EDITOR' or 'VIEWER'
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user role",
    });
  }
};
