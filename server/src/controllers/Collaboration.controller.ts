import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ==================== COLLABORATOR MANAGEMENT ====================

// GET all collaborators for a project
export const getProjectCollaborators = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params;

    const collaborators = await prisma.projectCollaborator.findMany({
      where: { project_id },
      orderBy: { added_at: "desc" },
    });

    // Get user details for each collaborator
    const collaboratorsWithUsers = await Promise.all(
      collaborators.map(async (collab) => {
        const user = await prisma.user.findUnique({
          where: { clerk_id: collab.clerk_id },
          select: {
            clerk_id: true,
            username: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        });
        return { ...collab, user };
      })
    );

    return res.status(200).json({
      success: true,
      data: collaboratorsWithUsers,
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collaborators",
    });
  }
};

// POST add collaborator to project
export const addCollaborator = async (req: Request, res: Response) => {
  try {
    const { project_id, clerk_id, role, added_by } = req.body;

    // Validation
    if (!project_id || !clerk_id || !added_by) {
      return res.status(400).json({
        success: false,
        message: "project_id, clerk_id, and added_by are required",
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user adding the collaborator has permission (owner or editor)
    const requester = await prisma.projectCollaborator.findUnique({
      where: {
        project_id_clerk_id: {
          project_id,
          clerk_id: added_by,
        },
      },
    });

    // Check if requester is owner or has permission
    if (project.clerk_id !== added_by && (!requester || requester.role === "viewer")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add collaborators",
      });
    }

    // Check if collaborator already exists
    const existingCollab = await prisma.projectCollaborator.findUnique({
      where: {
        project_id_clerk_id: {
          project_id,
          clerk_id,
        },
      },
    });

    if (existingCollab) {
      return res.status(400).json({
        success: false,
        message: "User is already a collaborator",
      });
    }

    // Add collaborator
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        project_id,
        clerk_id,
        role: role || "editor",
        added_by,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Collaborator added successfully",
      data: collaborator,
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add collaborator",
    });
  }
};

// PUT update collaborator role
export const updateCollaboratorRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, updated_by } = req.body;

    if (!role || !updated_by) {
      return res.status(400).json({
        success: false,
        message: "role and updated_by are required",
      });
    }

    // Get collaborator
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id },
    });

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: "Collaborator not found",
      });
    }

    // Check permission
    const project = await prisma.project.findUnique({
      where: { id: collaborator.project_id },
    });

    if (!project || project.clerk_id !== updated_by) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can change roles",
      });
    }

    // Update role
    const updated = await prisma.projectCollaborator.update({
      where: { id },
      data: { role },
    });

    // Notify user via Socket.IO about role change
    try {
      const { collaborationSocket } = await import('../index');
      collaborationSocket.notifyRoleChange(collaborator.project_id, collaborator.clerk_id, role);
    } catch (error) {
      console.error('Failed to notify role change via socket:', error);
    }

    return res.status(200).json({
      success: true,
      message: "Collaborator role updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating collaborator:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update collaborator",
    });
  }
};

// DELETE remove collaborator
export const removeCollaborator = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { removed_by } = req.body;

    const collaborator = await prisma.projectCollaborator.findUnique({
      where: { id },
    });

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: "Collaborator not found",
      });
    }

    // Check permission
    const project = await prisma.project.findUnique({
      where: { id: collaborator.project_id },
    });

    if (!project || (project.clerk_id !== removed_by && collaborator.clerk_id !== removed_by)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    await prisma.projectCollaborator.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove collaborator",
    });
  }
};

// ==================== INVITATION MANAGEMENT ====================

// POST send invitation
export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { project_id, email, role, invited_by } = req.body;

    if (!project_id || !email || !invited_by) {
      return res.status(400).json({
        success: false,
        message: "project_id, email, and invited_by are required",
      });
    }

    // Check project and permission
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if requester has permission
    const requester = await prisma.projectCollaborator.findUnique({
      where: {
        project_id_clerk_id: {
          project_id,
          clerk_id: invited_by,
        },
      },
    });

    if (project.clerk_id !== invited_by && (!requester || requester.role === "viewer")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to send invitations",
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.projectInvitation.create({
      data: {
        project_id,
        email,
        role: role || "editor",
        invited_by,
        token,
        expires_at: expiresAt,
      },
    });

    // TODO: Send email with invitation link
    // const invitationLink = `${process.env.CLIENT_URL}/invite/${token}`;

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: invitation,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send invitation",
    });
  }
};

// GET invitation by token
export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Check if expired
    if (new Date() > invitation.expires_at) {
      await prisma.projectInvitation.update({
        where: { token },
        data: { status: "expired" },
      });

      return res.status(410).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitation",
    });
  }
};

// POST accept invitation
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, clerk_id } = req.body;

    if (!token || !clerk_id) {
      return res.status(400).json({
        success: false,
        message: "token and clerk_id are required",
      });
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invalid or already used invitation",
      });
    }

    if (new Date() > invitation.expires_at) {
      return res.status(410).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    // Add as collaborator
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        project_id: invitation.project_id,
        clerk_id,
        role: invitation.role,
        added_by: invitation.invited_by,
      },
    });

    // Update invitation status
    await prisma.projectInvitation.update({
      where: { token },
      data: { status: "accepted" },
    });

    return res.status(200).json({
      success: true,
      message: "Invitation accepted",
      data: collaborator,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept invitation",
    });
  }
};

// PUT update pending invitation role
export const updateInvitationRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, updated_by } = req.body;

    if (!role || !updated_by) {
      return res.status(400).json({
        success: false,
        message: "role and updated_by are required",
      });
    }

    // Get invitation
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only update pending invitations. User has already accepted, update their collaborator role instead.",
      });
    }

    // Check permission
    const project = await prisma.project.findUnique({
      where: { id: invitation.project_id },
    });

    if (!project || project.clerk_id !== updated_by) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can change invitation roles",
      });
    }

    // Update role
    const updated = await prisma.projectInvitation.update({
      where: { id },
      data: { role },
    });

    return res.status(200).json({
      success: true,
      message: "Invitation role updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invitation",
    });
  }
};

// ==================== ACTIVE SESSIONS (Real-time Presence) ====================

// POST update user session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { project_id, clerk_id, username, color, cursor_pos } = req.body;

    if (!project_id || !clerk_id) {
      return res.status(400).json({
        success: false,
        message: "project_id and clerk_id are required",
      });
    }

    const session = await prisma.activeSession.upsert({
      where: {
        project_id_clerk_id: {
          project_id,
          clerk_id,
        },
      },
      update: {
        username,
        color,
        cursor_pos,
        last_seen: new Date(),
      },
      create: {
        project_id,
        clerk_id,
        username: username || "Anonymous",
        color: color || "#000000",
        cursor_pos,
        last_seen: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update session",
    });
  }
};

// GET active sessions for a project
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params;

    // Get sessions active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const sessions = await prisma.activeSession.findMany({
      where: {
        project_id,
        last_seen: {
          gte: fiveMinutesAgo,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
    });
  }
};

// DELETE remove session (user left)
export const removeSession = async (req: Request, res: Response) => {
  try {
    const { project_id, clerk_id } = req.body;

    await prisma.activeSession.delete({
      where: {
        project_id_clerk_id: {
          project_id,
          clerk_id,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Session removed",
    });
  } catch (error) {
    console.error("Error removing session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove session",
    });
  }
};
