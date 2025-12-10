'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, XCircle } from 'lucide-react';
import { revokeDelegation, deleteDelegation } from '@/actions/delegations';

interface DelegationActionsProps {
  delegation: {
    id: string;
    isActive: boolean;
    startDate: string | Date;
    endDate: string | Date;
  };
}

export default function DelegationActions({ delegation }: DelegationActionsProps) {
  const router = useRouter();
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'revoke' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const isActive = delegation.isActive && 
    now >= new Date(delegation.startDate) && 
    now <= new Date(delegation.endDate);

  const handleRevoke = async () => {
    setIsRevoking(true);
    setError(null);

    try {
      const result = await revokeDelegation(delegation.id);
      if (result.success) {
        router.refresh();
        setShowConfirm(null);
      } else {
        setError(result.error || 'Failed to revoke delegation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error revoking delegation:', err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteDelegation(delegation.id);
      if (result.success) {
        router.push('/dashboard/delegations');
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete delegation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error deleting delegation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Actions Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {/* Revoke Button - Only show if active */}
          {delegation.isActive && (
            <Button
              variant="destructive"
              onClick={() => setShowConfirm('revoke')}
              disabled={isRevoking || isDeleting}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Revoke Delegation
            </Button>
          )}

          {/* Delete Button - Only show if not active or expired */}
          {!isActive && (
            <Button
              variant="outline"
              onClick={() => setShowConfirm('delete')}
              disabled={isRevoking || isDeleting}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Delegation
            </Button>
          )}
        </div>
      </Card>

      {/* Confirmation Modal for Revoke */}
      {showConfirm === 'revoke' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Revoke Delegation?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will immediately remove the delegated permission. The employee will no longer have access to the granted permission. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(null)}
                disabled={isRevoking}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={isRevoking}
              >
                {isRevoking ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {showConfirm === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Delegation?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete this delegation record. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
