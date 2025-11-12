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

export class CollaborationSocket {
  private io: Server;
  private userSessions: Map<string, UserSession> = new Map();

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
      socket.on('cursor-move', (data: { position: CursorPosition }) => {
        const session = this.userSessions.get(socket.id);
        if (!session) return;

        // Broadcast cursor position to all other users in the room
        socket.to(`project:${session.projectId}`).emit('cursor-update', {
          socketId: socket.id,
          username: session.username,
          color: session.color,
          position: data.position,
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
    } catch (error) {
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

  public getIO(): Server {
    return this.io;
  }
}
