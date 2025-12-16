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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

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
        nameTh: '',
        nameJa: '',
        descriptionTh: '',
        descriptionJa: '',
    });

    const handleOpenDialog = (category?: SerializedAssessmentCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                sortOrder: category.sortOrder,
                nameTh: (category as any).nameTh || '',
                nameJa: (category as any).nameJa || '',
                descriptionTh: (category as any).descriptionTh || '',
                descriptionJa: (category as any).descriptionJa || '',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                sortOrder: categories.length + 1,
                nameTh: '',
                nameJa: '',
                descriptionTh: '',
                descriptionJa: '',
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



    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Assessment Categories</h3>
                <div className="space-x-2">
                    <DeleteConfirmationDialog
                        trigger={
                            <Button variant="destructive" disabled={categories.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" /> Clear All
                            </Button>
                        }
                        title="Clear All Categories?"
                        description={`This will permanently delete ${categories.length} categories. This action cannot be undone. Categories used in questions will not be deleted.`}
                        onConfirm={async () => {
                            const ids = categories.map(c => c.id);
                            const result = await deleteAssessmentCategories(ids);
                            if (result.success) {
                                router.refresh();
                            } else {
                                alert(result.error);
                            }
                        }}
                        deleteKeyword="DELETE"
                        variant="button"
                    />
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
                                    <DeleteConfirmationDialog
                                        title="Delete Category?"
                                        itemIdentifier={cat.name}
                                        onConfirm={() => handleDelete(cat.id)}
                                        description="Deleting a category might affect questions assigned to it. This action cannot be undone."
                                        variant="icon"
                                        deleteKeyword="DELETE"
                                    />
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
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="localized">Localization (TH/JA)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="space-y-4 pt-4">
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
                            </TabsContent>

                            <TabsContent value="localized" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name (Thai)</label>
                                        <Input
                                            value={formData.nameTh}
                                            onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                                            placeholder="ชื่อหมวดหมู่ (ไทย)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name (Japanese)</label>
                                        <Input
                                            value={formData.nameJa}
                                            onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                                            placeholder="カテゴリ名 (日本語)"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description (Thai)</label>
                                        <Input
                                            value={formData.descriptionTh}
                                            onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
                                            placeholder="คำอธิบาย (ไทย)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description (Japanese)</label>
                                        <Input
                                            value={formData.descriptionJa}
                                            onChange={(e) => setFormData({ ...formData, descriptionJa: e.target.value })}
                                            placeholder="説明 (日本語)"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    );
}
