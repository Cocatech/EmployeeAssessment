'use client';

import { useState, useTransition, useEffect } from 'react';
import { AssessmentLevel } from '@prisma/client';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
    createAssessmentLevel,
    updateAssessmentLevel,
    deleteAssessmentLevel,
    toggleAssessmentLevelStatus,
} from '@/actions/levels';
import { Edit2, Trash2, Plus, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

type SerializedAssessmentLevel = Omit<AssessmentLevel, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

interface LevelManagerProps {
    initialLevels: SerializedAssessmentLevel[];
}

export function LevelManager({ initialLevels }: LevelManagerProps) {
    const router = useRouter();
    const [levels, setLevels] = useState(initialLevels);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<SerializedAssessmentLevel | null>(null);

    // Sync state with props
    useEffect(() => {
        setLevels(initialLevels);
    }, [initialLevels]);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        label: '',
        formTitle: '',
        sortOrder: 0,
        nameTh: '',
        nameJa: '',
        descriptionTh: '',
        descriptionJa: '',
    });

    const handleOpenDialog = (level?: SerializedAssessmentLevel) => {
        if (level) {
            setEditingLevel(level);
            setFormData({
                code: level.code,
                name: level.name,
                description: level.description || '',
                label: level.label,
                formTitle: (level as any).formTitle || '',
                sortOrder: level.sortOrder,
                nameTh: (level as any).nameTh || '',
                nameJa: (level as any).nameJa || '',
                descriptionTh: (level as any).descriptionTh || '',
                descriptionJa: (level as any).descriptionJa || '',
            });
        } else {
            setEditingLevel(null);
            setFormData({
                code: '',
                name: '',
                description: '',
                label: '',
                formTitle: '',
                sortOrder: levels.length + 1,
                nameTh: '',
                nameJa: '',
                descriptionTh: '',
                descriptionJa: '',
            });
        }
        setIsDialogOpen(true);
    };

    const calculateLabel = (code: string, name: string, desc: string) => {
        // Auto-generate label if empty: "Code - Name (Description)"
        if (!desc) return `${code} - ${name}`;
        return `${code} - ${name} (${desc})`;
    };

    const handleSave = async () => {
        const label = formData.label || calculateLabel(formData.code, formData.name, formData.description);

        startTransition(async () => {
            let result;
            if (editingLevel) {
                result = await updateAssessmentLevel(editingLevel.id, { ...formData, label });
            } else {
                result = await createAssessmentLevel({ ...formData, label });
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
        if (!confirm('Are you sure you want to delete this level? Questions assigned to this level might be affected.')) return;

        startTransition(async () => {
            const result = await deleteAssessmentLevel(id);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        startTransition(async () => {
            await toggleAssessmentLevelStatus(id, !currentStatus);
            router.refresh();
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Assessment Levels</h3>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Level
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Label (Display Name)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {levels.map((level) => (
                            <TableRow key={level.id}>
                                <TableCell>{level.sortOrder}</TableCell>
                                <TableCell className="font-medium">{level.code}</TableCell>
                                <TableCell>{level.label}</TableCell>
                                <TableCell>
                                    <Badge variant={level.isActive ? 'default' : 'secondary'}>
                                        {level.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleStatus(level.id, level.isActive)}
                                        title={level.isActive ? "Deactivate" : "Activate"}
                                    >
                                        <Power className={`w-4 h-4 ${level.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(level)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <DeleteConfirmationDialog
                                        title="Delete Level?"
                                        itemIdentifier={level.label}
                                        onConfirm={() => handleDelete(level.id)}
                                        variant="icon"
                                        deleteKeyword="DELETE"
                                        description="Deleting a level might affect questions assigned to it. This action cannot be undone."
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
                        <DialogTitle>{editingLevel ? 'Edit Level' : 'Add New Level'}</DialogTitle>
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
                                        <label className="text-sm font-medium">Code</label>
                                        <Input
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. L1-Supplier"
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
                                    <label className="text-sm font-medium">Internal Name (English)</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Supplier"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Legacy Description</label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. ผู้จัดหา"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Display Label</label>
                                    <Input
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="L1-Supplier - Supplier"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assessment Form Title</label>
                                    <Input
                                        value={formData.formTitle}
                                        onChange={(e) => setFormData({ ...formData, formTitle: e.target.value })}
                                        placeholder="e.g. OPERATOR EVALUATION SHEET"
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
                                            placeholder="ชื่อระดับ (ไทย)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name (Japanese)</label>
                                        <Input
                                            value={formData.nameJa}
                                            onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                                            placeholder="レベル名 (日本語)"
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
        </div >
    );
}
