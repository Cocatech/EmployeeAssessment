'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Loader2 } from 'lucide-react';
import { deleteAssessment, assignAssessmentToEmployees } from '@/actions/assessments';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface DraftActionsProps {
    assessmentId: string;
    targetLevel: string;
}

export function DraftActions({ assessmentId, targetLevel }: DraftActionsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this assessment draft? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            const result = await deleteAssessment(assessmentId);
            if (result.success) {
                router.push('/dashboard/assessments');
            } else {
                setError(result.error || 'Failed to delete assessment');
            }
        } catch (err) {
            setError('An error occurred while deleting');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAssign = async () => {
        // Dialog handles confirmation now
        setIsAssigning(true);
        setError('');
        setSuccess('');

        try {
            const result = await assignAssessmentToEmployees(assessmentId);
            if (result.success) {
                setSuccess(result.message || `Assigned to ${result.count} employees`);
                setIsAssignDialogOpen(false); // Close dialog on success
                setTimeout(() => {
                    router.push('/dashboard/assessments');
                    router.refresh();
                }, 2000);
            } else {
                setError(result.error || 'Failed to assign assessment');
                // Keep dialog open if error? Or close? Users usually prefer seeing the error.
                // Since error state is outside dialog (in current structure), we might want to close dialog to show error in main view, 
                // OR better, move error state inside dialog. 
                // For now, I'll close dialog and show error in the main component as per original design.
                setIsAssignDialogOpen(false);
            }
        } catch (err) {
            setError('An error occurred while assigning');
            setIsAssignDialogOpen(false);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            disabled={isAssigning || isDeleting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isAssigning ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Users className="mr-2 h-4 w-4" />
                            )}
                            Assign to Employees
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Assignment</DialogTitle>
                            <DialogDescription>
                                This will assign the assessment to all employees at level <strong>"{targetLevel}"</strong>.
                                <br />
                                Are you sure you want to continue?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isAssigning}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssign} disabled={isAssigning} className="bg-green-600 hover:bg-green-700">
                                {isAssigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...
                                    </>
                                ) : (
                                    'Confirm Assignment'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || isAssigning}
                >
                    {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Draft
                </Button>
            </div>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            {success && (
                <p className="text-sm text-green-600">{success}</p>
            )}
        </div>
    );
}
