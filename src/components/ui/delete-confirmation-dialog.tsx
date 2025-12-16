'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmationDialogProps {
    title?: string;
    description?: React.ReactNode;
    trigger?: React.ReactNode;
    triggerLabel?: string; // If using default trigger
    onConfirm: () => Promise<void> | void;
    isLoading?: boolean;
    itemIdentifier?: string; // Name of item being deleted (shows in description)
    typeToConfirm?: boolean; // Force typing 'DELETE'
    deleteKeyword?: string; // Default: 'DELETE'
    variant?: 'icon' | 'button';
    icon?: any;
}

export function DeleteConfirmationDialog({
    title = 'Delete Item?',
    description,
    trigger,
    triggerLabel = 'Delete',
    onConfirm,
    isLoading: externalIsLoading,
    itemIdentifier,
    typeToConfirm = true,
    deleteKeyword = 'DELETE',
    variant = 'icon',
    icon: Icon = Trash2,
}: DeleteConfirmationDialogProps) {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [internalIsLoading, setInternalIsLoading] = useState(false);

    // Use external loading state if provided, otherwise local
    const isLoading = externalIsLoading ?? internalIsLoading;

    const handleConfirm = async () => {
        if (typeToConfirm && confirmText !== deleteKeyword) return;

        setInternalIsLoading(true);
        try {
            await onConfirm();
            setOpen(false);
            setConfirmText('');
        } catch (error) {
            console.error('Delete action failed', error);
            // Optional: Add toast error here
        } finally {
            setInternalIsLoading(false);
        }
    };

    const isConfirmDisabled = typeToConfirm && confirmText !== deleteKeyword;

    const defaultDescription = itemIdentifier
        ? <span>This will permanently delete <strong>{itemIdentifier}</strong>. This action cannot be undone.</span>
        : 'This action cannot be undone. This will permanently delete the selected item.';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    variant === 'icon' ? (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Icon className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="destructive" size="sm">
                            <Icon className="h-4 w-4 mr-2" />
                            {triggerLabel}
                        </Button>
                    )
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        {/* <AlertTriangle className="h-5 w-5" /> */}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {description || defaultDescription}
                    </DialogDescription>
                </DialogHeader>

                {typeToConfirm && (
                    <div className="py-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Type <span className="font-bold text-red-600 select-none">{deleteKeyword}</span> to confirm.
                        </p>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={`Type ${deleteKeyword}`}
                            className={cn(
                                "border-red-200 focus-visible:ring-red-500 bg-red-50/50",
                                confirmText === deleteKeyword && "border-green-500 focus-visible:ring-green-500 bg-green-50/50"
                            )}
                            autoComplete="off"
                        />
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading || isConfirmDisabled}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Forever'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
