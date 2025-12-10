'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DraggableList, FormModal } from '@/components/settings/DraggableList';
import {
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
} from '@/actions/settings';
import { Plus } from 'lucide-react';

interface Group {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface GroupManagerProps {
  groups: Group[];
}

export function GroupManager({ groups }: GroupManagerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Group | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Group) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    const result = await deleteGroup(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingItem) {
      const result = await updateGroup(editingItem.id, data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } else {
      const result = await createGroup(data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const handleReorder = async (items: { id: string; sortOrder: number }[]) => {
    await reorderGroups(items);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      <DraggableList
        items={groups}
        onReorder={handleReorder}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemLabel="Group"
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Group' : 'Add Group'}
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
