'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DraggableList, FormModal } from '@/components/settings/DraggableList';
import {
  createAssessmentType,
  updateAssessmentType,
  deleteAssessmentType,
  reorderAssessmentTypes,
} from '@/actions/settings';
import { Plus } from 'lucide-react';

interface AssessmentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface AssessmentTypeManagerProps {
  assessmentTypes: AssessmentType[];
}

export function AssessmentTypeManager({ assessmentTypes }: AssessmentTypeManagerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssessmentType | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AssessmentType) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment type?')) {
      return;
    }

    const result = await deleteAssessmentType(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleReorder = async (items: { id: string; sortOrder: number }[]) => {
    await reorderAssessmentTypes(items);
    router.refresh();
  };

  const handleSubmit = async (data: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }) => {
    if (editingItem) {
      // Update
      const result = await updateAssessmentType(editingItem.id, data);
      if (result.success) {
        setIsModalOpen(false);
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    } else {
      // Create
      const result = await createAssessmentType(data);
      if (result.success) {
        setIsModalOpen(false);
        router.refresh();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Assessment Types</h2>
          <p className="text-sm text-muted-foreground">
            Manage assessment period types (Annual, Mid-year, Probation, Special)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assessment Type
        </Button>
      </div>

      <DraggableList
        items={assessmentTypes}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
        itemLabel="Assessment Type"
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Assessment Type' : 'Add Assessment Type'}
        initialData={editingItem ? { ...editingItem, description: editingItem.description || undefined } : undefined}
        fields={{
          code: true,
          name: true,
          description: true,
          isActive: !!editingItem,
        }}
      />
    </>
  );
}
