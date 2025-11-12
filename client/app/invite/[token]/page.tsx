"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';
import { CheckCircle2, ExternalLink, Loader2, UserPlus, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  project_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  status: string;
  expires_at: string;
  project: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (token && isLoaded) {
      loadInvitation();
    }
  }, [token, isLoaded]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/collaboration/projects/invitations/${token}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invitation not found or has expired');
        }
        throw new Error('Failed to load invitation');
      }

      const data = await response.json();
      
      if (data.success) {
        setInvitation(data.data);
        
        // Check if expired
        if (new Date() > new Date(data.data.expires_at)) {
          setError('This invitation has expired');
        } else if (data.data.status !== 'pending') {
          setError('This invitation has already been used');
        }
      } else {
        setError(data.message || 'Failed to load invitation');
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user?.id || !invitation) {
      toast.error('You must be signed in to accept this invitation');
      return;
    }

    try {
      setAccepting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api/collaboration/projects/invitations/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            clerk_id: user.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Invitation accepted! Redirecting to project...');
        
        // Redirect to main page - project will appear in their list
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to accept invitation');
        setError(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error('Failed to accept invitation');
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = () => {
    router.push('/');
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              {error || 'This invitation link is not valid'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>You're Invited!</CardTitle>
          </div>
          <CardDescription>
            You've been invited to collaborate on a project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="text-lg font-semibold">{invitation.project.name}</p>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Your Role</p>
                <p className="font-medium capitalize">{invitation.role}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Invited To</p>
                <p className="font-medium truncate">{invitation.email}</p>
              </div>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium mb-2">
              As an <span className="capitalize">{invitation.role}</span>, you can:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {invitation.role === 'editor' ? (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    View and edit the project
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Add and delete elements
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Collaborate in real-time
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    View the project
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Cannot edit or delete
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Current User Info */}
          {user && (
            <div className="text-sm text-muted-foreground">
              Accepting as: <span className="font-medium text-foreground">{user.emailAddresses[0]?.emailAddress}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1"
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1"
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>

          {/* Expiry Info */}
          <p className="text-xs text-center text-muted-foreground">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
