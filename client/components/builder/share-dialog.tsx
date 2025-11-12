import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Copy, Crown, Edit3, Eye, Mail, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  clerk_id: string;
  role: string;
  user?: {
    username?: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  isOwner: boolean;
  currentUserClerkId: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  isOwner,
  currentUserClerkId,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Load collaborators when dialog opens
  useEffect(() => {
    if (open && projectId) {
      loadCollaborators();
    }
  }, [open, projectId]);

  const loadCollaborators = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/collaboration/projects/${projectId}/collaborators`;
      console.log('📡 Loading collaborators from:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('📥 Collaborators data:', data);
      
      if (data.success) {
        setCollaborators(data.data || []);
      }
    } catch (error) {
      console.error('❌ Error loading collaborators:', error);
      // Don't show error toast on first load
    }
  };

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    console.log('🚀 Sending invitation...', {
      projectId,
      email: inviteEmail,
      role: inviteRole,
      invitedBy: currentUserClerkId,
      serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
    });

    setIsLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/collaboration/projects/invitations`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          email: inviteEmail,
          role: inviteRole,
          invited_by: currentUserClerkId,
        }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);

      if (data.success) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        const link = `${window.location.origin}/invite/${data.data.token}`;
        setShareLink(link);
        console.log('🔗 Share link generated:', link);
      } else {
        toast.error(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      toast.error(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard');
    }
  };

  // Update collaborator role
  const handleUpdateRole = async (collaboratorId: string, newRole: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/collaboration/projects/collaborators/${collaboratorId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: newRole,
            updated_by: currentUserClerkId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Role updated');
        loadCollaborators();
      } else {
        toast.error(data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/collaboration/projects/collaborators/${collaboratorId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            removed_by: currentUserClerkId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Collaborator removed');
        loadCollaborators();
      } else {
        toast.error(data.message || 'Failed to remove collaborator');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'editor':
        return <Edit3 className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{projectName}"
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Section */}
          {isOwner && (
            <div className="space-y-3">
              <Label>Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSendInvite} disabled={isLoading}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>

              {shareLink && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Input value={shareLink} readOnly className="bg-background" />
                  <Button size="icon" variant="ghost" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-3">
            <Label>People with access</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {collaborator.user?.first_name?.[0] ||
                          collaborator.user?.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {collaborator.user?.first_name && collaborator.user?.last_name
                          ? `${collaborator.user.first_name} ${collaborator.user.last_name}`
                          : collaborator.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {collaborator.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && collaborator.role !== 'owner' ? (
                      <Select
                        value={collaborator.role}
                        onValueChange={(value) =>
                          handleUpdateRole(collaborator.id, value)
                        }
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <span className="flex items-center gap-2">
                              <Edit3 className="h-3 w-3" />
                              Editor
                            </span>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <span className="flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              Viewer
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(collaborator.role)}
                          {collaborator.role}
                        </span>
                      </Badge>
                    )}

                    {isOwner &&
                      collaborator.role !== 'owner' &&
                      collaborator.clerk_id !== currentUserClerkId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
