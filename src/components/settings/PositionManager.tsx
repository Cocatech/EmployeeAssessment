'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DraggableList, FormModal } from '@/components/settings/DraggableList';
import {
  createPosition,
  updatePosition,
  deletePosition,
  reorderPositions,
} from '@/actions/settings';
import { Plus } from 'lucide-react';

interface Position {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface PositionManagerProps {
  positions: Position[];
}

export function PositionManager({ positions }: PositionManagerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Position | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Position) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) {
      return;
    }

    const result = await deletePosition(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingItem) {
      const result = await updatePosition(editingItem.id, data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } else {
      const result = await createPosition(data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const handleReorder = async (items: { id: string; sortOrder: number }[]) => {
    await reorderPositions(items);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Position
        </Button>
      </div>

      <DraggableList
        items={positions}
        onReorder={handleReorder}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemLabel="Position"
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Position' : 'Add Position'}
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
