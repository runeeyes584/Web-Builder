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

export interface LayoutChange {
  headerHeight: number;
  footerHeight: number;
  sections: { id: string; height: number }[];
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
  const [layoutChanges, setLayoutChanges] = useState<LayoutChange[]>([]);
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
        // Remove any existing user with same clerkId OR same socketId (handle reconnection)
        const withoutOld = prev.filter(
          u => u.clerkId !== user.clerkId && u.socketId !== user.socketId
        );
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
        // Only update cursor position if user exists, don't add new users here
        const userIndex = prev.findIndex((u) => u.socketId === data.socketId);
        
        // If user not found, return previous state without creating new array
        if (userIndex === -1) {
          return prev;
        }
        
        // Only create new array if position actually changed
        const user = prev[userIndex];
        if (user.cursorPosition?.x === data.position.x && 
            user.cursorPosition?.y === data.position.y &&
            user.cursorPosition?.elementId === data.position.elementId) {
          return prev;
        }
        
        // Create new array with updated user
        const updated = [...prev];
        updated[userIndex] = { ...user, cursorPosition: data.position };
        return updated;
      });
    });

    // Element changes
    socket.on('element-changed', (change: ElementChange) => {
      setElementChanges((prev) => [...prev, change]);
    });

    // Layout changes
    socket.on('layout-changed', (change: LayoutChange) => {
      setLayoutChanges((prev) => [...prev, change]);
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

  // Send layout change
  const sendLayoutChange = (layout: { headerHeight: number; footerHeight: number; sections: { id: string; height: number }[] }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('layout-change', {
        ...layout,
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

  // Clear consumed layout changes
  const clearLayoutChanges = () => {
    setLayoutChanges([]);
  };

  return {
    isConnected,
    activeUsers,
    elementChanges,
    layoutChanges,
    sendCursorPosition,
    sendElementChange,
    sendLayoutChange,
    sendSelectionChange,
    sendTypingStart,
    sendTypingStop,
    clearElementChanges,
    clearLayoutChanges,
  };
}
