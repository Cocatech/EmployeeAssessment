'use client';

import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { deleteAssessment } from '@/actions/assessments';
import { useRouter } from 'next/navigation';

interface DeleteAssessmentButtonProps {
    id: string;
    title: string;
}

export function DeleteAssessmentButton({ id, title }: DeleteAssessmentButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        const result = await deleteAssessment(id);
        if (result.success) {
            router.refresh();
        } else {
            alert('Failed to delete assessment: ' + result.error);
        }
    };

    return (
        <DeleteConfirmationDialog
            title="Delete Assessment?"
            itemIdentifier={title}
            onConfirm={handleDelete}
        />
    );
}
