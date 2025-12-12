'use client';

import { useState, useTransition, useEffect } from 'react';
import { AssessmentCategory } from '@prisma/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    createAssessmentCategory,
    updateAssessmentCategory,
    deleteAssessmentCategory,
    deleteAssessmentCategories,
    toggleAssessmentCategoryStatus,
} from '@/actions/categories';
import { Edit2, Trash2, Plus, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SerializedAssessmentCategory = Omit<AssessmentCategory, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

interface CategoryManagerProps {
    initialCategories: SerializedAssessmentCategory[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<SerializedAssessmentCategory | null>(null);

    // Clear All State
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync state with props
    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sortOrder: 0,
    });

    const handleOpenDialog = (category?: SerializedAssessmentCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                sortOrder: category.sortOrder,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                sortOrder: categories.length + 1,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Name is required");

        startTransition(async () => {
            let result;
            if (editingCategory) {
                result = await updateAssessmentCategory(editingCategory.id, formData);
            } else {
                result = await createAssessmentCategory({ ...formData, isActive: true });
            }

            if (result.success) {
                setIsDialogOpen(false);
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? Questions assigned to this category might be affected.')) return;

        startTransition(async () => {
            const result = await deleteAssessmentCategory(id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            await toggleAssessmentCategoryStatus(id);
            router.refresh();
        })
    }

    // Clear All Logic
    const handleClearAllClick = () => {
        setDeleteConfirmText("");
        setIsClearDialogOpen(true);
    }

    const handleConfirmClear = async () => {
        if (deleteConfirmText !== "DELETE") return;

        setIsDeleting(true);
        const ids = categories.map(c => c.id);
        const result = await deleteAssessmentCategories(ids);

        setIsDeleting(false);
        setIsClearDialogOpen(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Assessment Categories</h3>
                <div className="space-x-2">
                    <Button variant="destructive" onClick={handleClearAllClick} disabled={categories.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear All
                    </Button>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell>{cat.sortOrder}</TableCell>
                                <TableCell className="font-medium">{cat.name}</TableCell>
                                <TableCell>{cat.description}</TableCell>
                                <TableCell>
                                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                                        {cat.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleStatus(cat.id, cat.isActive)}
                                        title={cat.isActive ? "Deactivate" : "Activate"}
                                    >
                                        <Power className={`w-4 h-4 ${cat.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cat)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Technical Knowledge"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sort Order</label>
                                <Input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description of this category..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Clear All Dialog */}
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Categories?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete {categories.length} categories.
                            This action cannot be undone. Categories used in questions will not be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-600">Type <span className="font-bold text-red-600">DELETE</span> to confirm.</p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                            className="font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClearDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClear}
                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete All"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
