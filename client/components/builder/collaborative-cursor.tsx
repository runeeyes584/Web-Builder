import { ActiveUser } from '@/hooks/use-collaboration';
import { useEffect, useState } from 'react';

interface CollaborativeCursorProps {
  users: ActiveUser[];
  containerRef: React.RefObject<HTMLElement>;
}

export function CollaborativeCursor({ users, containerRef }: CollaborativeCursorProps) {
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Deduplicate users by clerkId to prevent duplicate cursors
  const uniqueUsers = users.reduce((acc, user) => {
    const existing = acc.find(u => u.clerkId === user.clerkId);
    if (!existing) {
      acc.push(user);
    }
    return acc;
  }, [] as ActiveUser[]);

  useEffect(() => {
    const newCursors = new Map<string, { x: number; y: number }>();

    uniqueUsers.forEach((user) => {
      if (user.cursorPosition) {
        // Use clerkId as key instead of socketId for stable cursor tracking
        newCursors.set(user.clerkId, {
          x: user.cursorPosition.x,
          y: user.cursorPosition.y,
        });
      }
    });

    setCursors(newCursors);
  }, [uniqueUsers]);

  return (
    <>
      <style jsx>{`
        @keyframes cursor-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        .cursor-wrapper {
          animation: cursor-float 2s ease-in-out infinite;
        }
      `}</style>
      
      {uniqueUsers.map((user) => {
        const cursor = cursors.get(user.clerkId);
        if (!cursor) return null;

        return (
          <div
            key={user.clerkId}
            className="pointer-events-none absolute transition-all duration-100 ease-out cursor-wrapper"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              zIndex: 9999,
            }}
          >
            {/* Premium cursor design */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              {/* Outer glow */}
              <path
                d="M5.5 3.21V16.79L9.18 12.5L13.1 19.58L15.35 18.5L11.43 11.42L17.5 10.79L5.5 3.21Z"
                fill={user.color}
                opacity="0.3"
                transform="scale(1.1) translate(-1.2, -1.2)"
              />
              
              {/* Main cursor shape */}
              <path
                d="M5.5 3.21V16.79L9.18 12.5L13.1 19.58L15.35 18.5L11.43 11.42L17.5 10.79L5.5 3.21Z"
                fill={user.color}
              />
              
              {/* White border for contrast */}
              <path
                d="M5.5 3.21V16.79L9.18 12.5L13.1 19.58L15.35 18.5L11.43 11.42L17.5 10.79L5.5 3.21Z"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
                fill="none"
              />
              
              {/* Inner highlight */}
              <path
                d="M7 5.5V13.5L9.5 10.5L11 13L12 12.5L10.5 10L13.5 9.5L7 5.5Z"
                fill="white"
                opacity="0.4"
              />
            </svg>

            {/* User label with glassmorphism effect */}
            <div
              className="absolute left-7 top-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap"
              style={{ 
                backgroundColor: user.color,
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.3),
                  0 4px 16px ${user.color}60,
                  0 8px 24px ${user.color}30
                `,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {user.username}
            </div>

            {/* Activity ring indicator */}
            {user.selectedElements && user.selectedElements.length > 0 && (
              <>
                <div
                  className="absolute -left-2 -top-2 w-4 h-4 rounded-full border-2 border-white"
                  style={{ 
                    backgroundColor: user.color,
                    boxShadow: `0 0 8px ${user.color}`,
                  }}
                />
                <div
                  className="absolute -left-2 -top-2 w-4 h-4 rounded-full border-2 border-white animate-ping"
                  style={{ 
                    backgroundColor: user.color,
                    opacity: 0.6,
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
