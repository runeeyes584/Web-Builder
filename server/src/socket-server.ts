import { Server, Socket } from 'socket.io';
import { prisma } from './lib/prisma';

interface UserSession {
  projectId: string;
  clerkId: string;
  username: string;
  color: string;
}

interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
}

interface ElementChange {
  action: 'add' | 'update' | 'delete' | 'move';
  element: any;
  userId: string;
  username: string;
  timestamp: number;
}

interface LayoutChange {
  headerHeight: number;
  footerHeight: number;
  sections: { id: string; height: number }[];
  userId: string;
  username: string;
  timestamp: number;
  pageId?: string; // Page-specific layout change
}

export class CollaborationSocket {
  private io: Server;
  private userSessions: Map<string, UserSession> = new Map();
  private layoutSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id);

      // Join project room
      socket.on('join-project', async (data: { projectId: string; clerkId: string; username: string }) => {
        const { projectId, clerkId, username } = data;

        // Verify user has access to project
        const hasAccess = await this.verifyProjectAccess(projectId, clerkId);
        if (!hasAccess) {
          socket.emit('access-denied', { message: 'You do not have access to this project' });
          return;
        }

        // Check if user already has an active session and remove it (handle reconnection)
        let oldSocketId: string | null = null;
        this.userSessions.forEach((session, socketId) => {
          if (session.projectId === projectId && session.clerkId === clerkId && socketId !== socket.id) {
            oldSocketId = socketId;
            console.log(`Removing old session ${socketId} for user ${clerkId} before reconnect`);
          }
        });

        if (oldSocketId) {
          this.userSessions.delete(oldSocketId);
          // Notify others that old socket disconnected
          socket.to(`project:${projectId}`).emit('user-left', { socketId: oldSocketId });
        }

        // Join room
        socket.join(`project:${projectId}`);

        // Try to get existing color from database session, or generate new one
        let color = this.generateUserColor();
        try {
          const existingSession = await prisma.activeSession.findUnique({
            where: {
              project_id_clerk_id: {
                project_id: projectId,
                clerk_id: clerkId,
              },
            },
            select: { color: true },
          });

          if (existingSession && existingSession.color) {
            color = existingSession.color; // Reuse existing color
            console.log(`Reusing color ${color} for user ${clerkId}`);
          } else {
            console.log(`Generated new color ${color} for user ${clerkId}`);
          }
        } catch (error) {
          console.log('Could not fetch existing session, using new color');
        }

        // Store session
        this.userSessions.set(socket.id, { projectId, clerkId, username, color });

        // Update database session
        await this.updateDatabaseSession(projectId, clerkId, username, color);

        // Notify others that new user joined
        socket.to(`project:${projectId}`).emit('user-joined', {
          socketId: socket.id,
          username,
          color,
          clerkId,
        });

        // Send current active users to new user
        const activeUsers = await this.getActiveUsers(projectId);
        socket.emit('active-users', activeUsers);
      });

      // Leave project room
      socket.on('leave-project', async () => {
        await this.handleUserLeave(socket);
      });

      // Cursor movement
      socket.on('cursor-move', (data: { position: CursorPosition; pageId?: string }) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        // Broadcast cursor position to all other users in the room with pageId
        socket.to(`project:${session.projectId}`).emit('cursor-update', {
          socketId: socket.id,
          username: session.username,
          color: session.color,
          position: data.position,
          pageId: data.pageId,
        });
      });

      // Element changes
      socket.on('element-change', async (data: ElementChange) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        // Broadcast to others in the room
        socket.to(`project:${session.projectId}`).emit('element-changed', {
          ...data,
          socketId: socket.id,
          username: session.username,
        });

        // Save to edit history
        if (data.action !== 'move') {
          await this.saveEditHistory(session.projectId, session.clerkId, data);
        }
      });

      // Layout changes
      socket.on('layout-change', async (data: LayoutChange) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        // Verify user has edit permission (OWNER or EDITOR)
        const hasEditPermission = await this.verifyEditPermission(session.projectId, session.clerkId);
        if (!hasEditPermission) {
          console.log(`User ${session.clerkId} does not have permission to change layout`);
          return;
        }

        // Broadcast to others in the room (include pageId for page-specific updates)
        socket.to(`project:${session.projectId}`).emit('layout-changed', {
          ...data,
          socketId: socket.id,
          username: session.username,
        });

        // Auto-persist layout changes to database (Option C - Real-time persistence)
        // Debounced to prevent excessive writes during rapid changes (e.g., resize dragging)
        // Only save if pageId is provided (page-specific layout)
        if (data.pageId) {
          this.debouncedSaveLayout(session.projectId, data.pageId, {
            headerHeight: data.headerHeight,
            footerHeight: data.footerHeight,
            sections: data.sections,
          });
        }
      });

      // Typing indicator
      socket.on('start-typing', (data: { elementId: string }) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        socket.to(`project:${session.projectId}`).emit('user-typing', {
          username: session.username,
          elementId: data.elementId,
        });
      });

      socket.on('stop-typing', (data: { elementId: string }) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        socket.to(`project:${session.projectId}`).emit('user-stopped-typing', {
          username: session.username,
          elementId: data.elementId,
        });
      });

      // Selection changes
      socket.on('selection-change', (data: { elementIds: string[] }) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        socket.to(`project:${session.projectId}`).emit('user-selection', {
          socketId: socket.id,
          username: session.username,
          color: session.color,
          elementIds: data.elementIds,
        });
      });

      // Disconnect
      socket.on('disconnect', async () => {
        await this.handleUserLeave(socket);
      });
    });
  }

  private async handleUserLeave(socket: Socket) {
    const session = this.userSessions.get(socket.id);
    if (!session) return;

    const { projectId, clerkId, username } = session;

    // Notify others
    socket.to(`project:${projectId}`).emit('user-left', {
      socketId: socket.id,
      username,
      clerkId,
    });

    // Remove from database
    await this.removeDatabaseSession(projectId, clerkId);

    // Remove from memory
    this.userSessions.delete(socket.id);

    // Leave room
    socket.leave(`project:${projectId}`);
  }

  private async verifyProjectAccess(projectId: string, clerkId: string): Promise<boolean> {
    try {
      // Check if user owns the project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (project?.clerk_id === clerkId) {
        return true;
      }

      // Check if user is a collaborator
      const collaborator = await prisma.projectCollaborator.findUnique({
        where: {
          project_id_clerk_id: {
            project_id: projectId,
            clerk_id: clerkId,
          },
        },
      });

      return !!collaborator;
    } catch (error) {
      console.error('Error verifying project access:', error);
      return false;
    }
  }

  private async verifyEditPermission(projectId: string, clerkId: string): Promise<boolean> {
    try {
      // Check if user owns the project (OWNER has edit permission)
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (project?.clerk_id === clerkId) {
        return true;
      }

      // Check if user is a collaborator with EDITOR role
      const collaborator = await prisma.projectCollaborator.findUnique({
        where: {
          project_id_clerk_id: {
            project_id: projectId,
            clerk_id: clerkId,
          },
        },
      });

      return collaborator?.role === 'EDITOR';
    } catch (error) {
      console.error('Error verifying edit permission:', error);
      return false;
    }
  }

  private async updateDatabaseSession(
    projectId: string,
    clerkId: string,
    username: string,
    color: string
  ) {
    try {
      await prisma.activeSession.upsert({
        where: {
          project_id_clerk_id: {
            project_id: projectId,
            clerk_id: clerkId,
          },
        },
        update: {
          username,
          color,
          last_seen: new Date(),
        },
        create: {
          project_id: projectId,
          clerk_id: clerkId,
          username,
          color,
          last_seen: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating database session:', error);
    }
  }

  private async removeDatabaseSession(projectId: string, clerkId: string) {
    try {
      await prisma.activeSession.delete({
        where: {
          project_id_clerk_id: {
            project_id: projectId,
            clerk_id: clerkId,
          },
        },
      });
    } catch (error: any) {
      // Ignore P2025 error (record not found) - session may have already been deleted
      if (error.code === 'P2025') {
        console.log(`Session already removed for user ${clerkId} in project ${projectId}`);
        return;
      }
      console.error('Error removing database session:', error);
    }
  }

  private async getActiveUsers(projectId: string) {
    try {
      // Get users from in-memory sessions (real-time data)
      const activeUsers: any[] = [];

      this.userSessions.forEach((session, socketId) => {
        if (session.projectId === projectId) {
          activeUsers.push({
            socketId,
            clerkId: session.clerkId,
            username: session.username,
            color: session.color,
          });
        }
      });

      return activeUsers;
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  private async saveEditHistory(projectId: string, clerkId: string, change: ElementChange) {
    try {
      // Get project pages
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { pages: true },
      });

      if (!project || project.pages.length === 0) return;

      const pageId = project.pages[0].id;

      await prisma.editHistory.create({
        data: {
          page_id: pageId,
          clerk_id: clerkId,
          action: change.action.toUpperCase(),
          component_snapshot: change.element,
        },
      });
    } catch (error) {
      console.error('Error saving edit history:', error);
    }
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E63946', '#457B9D',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Save layout changes directly to database (Option C - Real-time persistence)
   * This method is called when users change layout via WebSocket events
   * Now accepts pageId to save layout to the specific page, not the first page
   */
  private async saveLayoutToDatabase(
    projectId: string,
    pageId: string,
    layout: {
      headerHeight: number;
      footerHeight: number;
      sections: { id: string; height: number }[];
    }
  ) {
    try {
      // Validate layout structure
      if (!layout || typeof layout.headerHeight !== 'number' || typeof layout.footerHeight !== 'number') {
        console.error('Invalid layout structure:', layout);
        return;
      }

      if (layout.headerHeight < 48 || layout.footerHeight < 48) {
        console.error('Invalid layout dimensions: header/footer must be >= 48px');
        return;
      }

      if (!Array.isArray(layout.sections)) {
        console.error('Invalid layout: sections must be an array');
        return;
      }

      // Validate section structure and uniqueness
      const sectionIds = new Set<string>();
      for (const section of layout.sections) {
        if (!section.id || typeof section.height !== 'number') {
          console.error('Invalid section structure:', section);
          return;
        }
        if (section.height < 128) {
          console.error('Invalid section height: must be >= 128px');
          return;
        }
        if (sectionIds.has(section.id)) {
          console.error('Duplicate section ID:', section.id);
          return;
        }
        sectionIds.add(section.id);
      }

      // Verify page exists and belongs to the project
      const page = await prisma.page.findFirst({
        where: { 
          id: pageId,
          project_id: projectId 
        },
      });

      if (!page) {
        console.error(`Page ${pageId} not found in project ${projectId}`);
        return;
      }

      // Merge layout into existing json_structure
      const currentStructure = page.json_structure as any;
      const updatedStructure = {
        ...currentStructure,
        layout: {
          headerHeight: layout.headerHeight,
          footerHeight: layout.footerHeight,
          sections: layout.sections.map(s => ({ id: s.id, height: s.height })),
        },
      };

      // Update page with new layout
      await prisma.page.update({
        where: { id: pageId },
        data: {
          json_structure: updatedStructure,
        },
      });

      console.log(`Layout auto-saved for page ${pageId} in project ${projectId} via WebSocket`);
    } catch (error) {
      console.error('Error saving layout to database:', error);
    }
  }

  /**
   * Debounced layout save - prevents excessive DB writes during rapid changes
   * Now uses pageId as part of the key to handle multiple pages independently
   */
  private debouncedSaveLayout(
    projectId: string,
    pageId: string,
    layout: {
      headerHeight: number;
      footerHeight: number;
      sections: { id: string; height: number }[];
    }
  ) {
    // Use combination of projectId and pageId as key to allow independent debouncing per page
    const timerKey = `${projectId}:${pageId}`;

    // Clear existing timer for this project+page combination
    const existingTimer = this.layoutSaveTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer (1 second debounce)
    const timer = setTimeout(() => {
      this.saveLayoutToDatabase(projectId, pageId, layout);
      this.layoutSaveTimers.delete(timerKey);
    }, 1000);

    this.layoutSaveTimers.set(timerKey, timer);
  }

  public getIO(): Server {
    return this.io;
  }
}
