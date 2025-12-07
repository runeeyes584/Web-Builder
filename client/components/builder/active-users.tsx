import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActiveUser } from '@/hooks/use-collaboration';
import { Circle } from 'lucide-react';
import { useMemo } from 'react';

interface ActiveUsersProps {
  users: ActiveUser[];
  currentUserClerkId: string;
  maxVisible?: number;
}

export function ActiveUsers({
  users,
  currentUserClerkId,
  maxVisible = 5,
}: ActiveUsersProps) {
  // Deduplicate users by clerkId (in case there are multiple socketIds for same user)
  // and filter out current user - use useMemo for stable reference
  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();
    return users.filter(user => {
      // Skip if this is the current user
      if (user.clerkId === currentUserClerkId) {
        return false;
      }

      // Check if we already have this user (by clerkId)
      if (seen.has(user.clerkId)) {
        return false;
      }
      seen.add(user.clerkId);
      return true;
    });
  }, [users, currentUserClerkId]);

  const visibleUsers = uniqueUsers.slice(0, maxVisible);
  const hiddenCount = uniqueUsers.length - maxVisible;

  if (uniqueUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Circle className="h-2 w-2 fill-current" />
        Only you
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md border border-border/50 rounded-full pl-1.5 pr-3 py-1.5 shadow-lg hover:shadow-xl transition-all hover:scale-105">
        <div className="flex -space-x-1.5">
          {visibleUsers.map((user) => (
            <Tooltip key={user.clerkId}>
              <TooltipTrigger>
                <Avatar
                  className="h-6 w-6 border-2 border-background ring-1 ring-white/10 transition-transform hover:scale-110 hover:z-10"
                  style={{ borderColor: user.color }}
                >
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{ backgroundColor: user.color, color: 'white' }}
                  >
                    {user.username[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{user.username}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-white/10">
                  <AvatarFallback className="text-[10px] font-bold bg-muted">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{hiddenCount} more online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-0.5">
          <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500 animate-pulse" />
          <span className="text-xs font-medium text-foreground/90">
            {uniqueUsers.length}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
