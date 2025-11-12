import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActiveUser } from '@/hooks/use-collaboration';
import { Circle } from 'lucide-react';

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
  const uniqueUsers = users.reduce((acc, user) => {
    const existing = acc.find(u => u.clerkId === user.clerkId);
    if (!existing && user.clerkId !== currentUserClerkId) {
      acc.push(user);
    }
    return acc;
  }, [] as ActiveUser[]);

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
      <div className="flex items-center gap-2">
        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.clerkId}>
              <TooltipTrigger>
                <Avatar
                  className="h-8 w-8 border-2 border-background"
                  style={{ borderColor: user.color }}
                >
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: user.color, color: 'white' }}
                  >
                    {user.username[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.username}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hiddenCount} more online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {uniqueUsers.length} {uniqueUsers.length === 1 ? 'person' : 'people'} online
        </span>
      </div>
    </TooltipProvider>
  );
}
