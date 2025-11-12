import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ActiveUser {
  socketId: string;
  clerkId: string;
  username: string;
  color: string;
  cursorPosition?: { x: number; y: number; elementId?: string };
  selectedElements?: string[];
}

export interface ElementChange {
  action: 'add' | 'update' | 'delete' | 'move';
  element: any;
  userId: string;
  username: string;
  timestamp: number;
}

interface UseCollaborationProps {
  projectId: string | null;
  clerkId: string;
  username: string;
  enabled?: boolean;
}

export function useCollaboration({
  projectId,
  clerkId,
  username,
  enabled = true,
}: UseCollaborationProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [elementChanges, setElementChanges] = useState<ElementChange[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !projectId || !clerkId) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);

      // Join project room
      socket.emit('join-project', {
        projectId,
        clerkId,
        username,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('access-denied', (data) => {
      console.error('Access denied:', data.message);
      socket.disconnect();
    });

    // Active users events
    socket.on('active-users', (users: ActiveUser[]) => {
      // Deduplicate by clerkId - keep the latest socketId for each clerkId
      const uniqueUsers = users.reduce((acc, user) => {
        const existing = acc.find(u => u.clerkId === user.clerkId);
        if (!existing) {
          acc.push(user);
        }
        return acc;
      }, [] as ActiveUser[]);
      setActiveUsers(uniqueUsers);
    });

    socket.on('user-joined', (user: ActiveUser) => {
      setActiveUsers((prev) => {
        // Remove any existing user with same clerkId (handle reconnection)
        const withoutOld = prev.filter(u => u.clerkId !== user.clerkId);
        // Add new user
        return [...withoutOld, user];
      });
    });

    socket.on('user-left', (data: { socketId: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
    });

    // Cursor updates
    socket.on('cursor-update', (data: {
      socketId: string;
      username: string;
      color: string;
      position: { x: number; y: number; elementId?: string };
    }) => {
      setActiveUsers((prev) => {
        const updated = prev.map((u) =>
          u.socketId === data.socketId
            ? { ...u, cursorPosition: data.position }
            : u
        );
        
        // If user not found, add them (they might have joined but we missed the event)
        const found = updated.find(u => u.socketId === data.socketId);
        if (!found) {
          return [...updated, {
            socketId: data.socketId,
            clerkId: '', // We don't have this from cursor update
            username: data.username,
            color: data.color,
            cursorPosition: data.position,
          }];
        }
        
        return updated;
      });
    });

    // Element changes
    socket.on('element-changed', (change: ElementChange) => {
      setElementChanges((prev) => [...prev, change]);
    });

    // Selection changes
    socket.on('user-selection', (data: {
      socketId: string;
      username: string;
      color: string;
      elementIds: string[];
    }) => {
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.socketId === data.socketId
            ? { ...u, selectedElements: data.elementIds }
            : u
        )
      );
    });

    // Typing indicators
    socket.on('user-typing', (data: { username: string; elementId: string }) => {
      // Handle typing indicator UI
    });

    socket.on('user-stopped-typing', (data: { username: string; elementId: string }) => {
      // Handle stop typing
    });

    return () => {
      socket.emit('leave-project');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, clerkId, username, enabled]);

  // Send cursor position
  const sendCursorPosition = (x: number, y: number, elementId?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', {
        position: { x, y, elementId },
      });
    }
  };

  // Send element change
  const sendElementChange = (change: Omit<ElementChange, 'userId' | 'username' | 'timestamp'>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('element-change', {
        ...change,
        userId: clerkId,
        username,
        timestamp: Date.now(),
      });
    }
  };

  // Send selection change
  const sendSelectionChange = (elementIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('selection-change', { elementIds });
    }
  };

  // Send typing indicator
  const sendTypingStart = (elementId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('start-typing', { elementId });
    }
  };

  const sendTypingStop = (elementId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop-typing', { elementId });
    }
  };

  // Clear consumed changes
  const clearElementChanges = () => {
    setElementChanges([]);
  };

  return {
    isConnected,
    activeUsers,
    elementChanges,
    sendCursorPosition,
    sendElementChange,
    sendSelectionChange,
    sendTypingStart,
    sendTypingStop,
    clearElementChanges,
  };
}
