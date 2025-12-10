'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DraggableList, FormModal } from '@/components/settings/DraggableList';
import {
  createTeam,
  updateTeam,
  deleteTeam,
  reorderTeams,
} from '@/actions/settings';
import { Plus } from 'lucide-react';

interface Team {
  id: string;
  code: string;
  name: string;
  groupCode?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface TeamManagerProps {
  teams: Team[];
  groups: { code: string; name: string }[];
}

export function TeamManager({ teams, groups }: TeamManagerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Team | null>(null);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Team) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    const result = await deleteTeam(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingItem) {
      const result = await updateTeam(editingItem.id, data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } else {
      const result = await createTeam(data);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    }
  };

  const handleReorder = async (items: { id: string; sortOrder: number }[]) => {
    await reorderTeams(items);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>

      <DraggableList
        items={teams}
        onReorder={handleReorder}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        itemLabel="Team"
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingItem ? 'Edit Team' : 'Add Team'}
        initialData={editingItem ? { ...editingItem, description: editingItem.description || undefined, groupCode: editingItem.groupCode || undefined } : undefined}
        fields={{
          code: true,
          name: true,
          groupCode: true,
          description: true,
          isActive: !!editingItem,
        }}
        groups={groups}
      />
    </>
  );
}
