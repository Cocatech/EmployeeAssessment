'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteAssessment } from '@/actions/assessments';
import { useRouter } from 'next/navigation';

interface DeleteAssessmentButtonProps {
    id: string;
    title: string;
}

export function DeleteAssessmentButton({ id, title }: DeleteAssessmentButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete assessment "${title}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteAssessment(id);
            if (result.success) {
                // Router refresh handled by server action revalidatePath, 
                // but explicit refresh ensures client state sync
                router.refresh();
            } else {
                alert('Failed to delete assessment: ' + result.error);
            }
        } catch (error) {
            alert('An unexpected error occurred');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    );
}
