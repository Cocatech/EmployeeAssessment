'use client';

import { useRouter } from 'next/navigation';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface DeleteUserButtonProps {
  userId: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteUserButton({ userId, deleteAction }: DeleteUserButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append('id', userId);
    await deleteAction(formData);
    router.refresh();
  };

  return (
    <DeleteConfirmationDialog
      title="Delete User?"
      itemIdentifier={`User ID: ${userId}`}
      onConfirm={handleDelete}
      triggerLabel="Delete User"
      variant="button"
    />
  );
}
