'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, GripVertical, X, Check } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';


interface DraggableItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface DraggableListProps {
  items: DraggableItem[];
  onReorder: (items: { id: string; sortOrder: number }[]) => Promise<void>;
  onAdd: () => void;
  onEdit: (item: DraggableItem) => void;
  onDelete: (id: string) => void;
  itemLabel: string;
}

export function DraggableList({
  items,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
  itemLabel,
}: DraggableListProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState(items);

  // Update items when props change
  useState(() => {
    setOrderedItems(items);
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = orderedItems.findIndex((item) => item.id === draggedItem);
    const targetIndex = orderedItems.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...orderedItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setOrderedItems(newItems);
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;

    // Update sort orders
    const updates = orderedItems.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }));

    await onReorder(updates);
    setDraggedItem(null);
  };

  if (orderedItems.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">No {itemLabel} found</p>
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add {itemLabel}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {orderedItems.map((item) => (
        <Card
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragEnd={handleDragEnd}
          className={`p-4 cursor-move transition-all ${draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
            } ${!item.isActive ? 'bg-gray-50' : ''}`}
        >
          <div className="flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {item.code}
                </span>
                {!item.isActive && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <DeleteConfirmationDialog
                title={`Delete ${itemLabel}?`}
                itemIdentifier={item.name}
                onConfirm={() => onDelete(item.id)}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
  initialData?: {
    code?: string;
    name?: string;
    description?: string;
    groupCode?: string;
    isActive?: boolean;
  };
  fields: {
    code?: boolean;
    name?: boolean;
    description?: boolean;
    groupCode?: boolean;
    isActive?: boolean;
  };
  groups?: { code: string; name: string }[];
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  fields,
  groups,
}: FormModalProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    groupCode: initialData?.groupCode || '',
    isActive: initialData?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: initialData?.code || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        groupCode: initialData?.groupCode || '',
        isActive: initialData?.isActive ?? true,
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only send fields that are enabled
      const submitData: any = {};
      if (fields.code) submitData.code = formData.code;
      if (fields.name) submitData.name = formData.name;
      if (fields.description) submitData.description = formData.description;
      if (fields.groupCode && formData.groupCode) submitData.groupCode = formData.groupCode;
      if (fields.isActive !== undefined) submitData.isActive = formData.isActive;

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.code && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MGR"
                required
                disabled={!!initialData?.code}
              />
            </div>
          )}

          {fields.name && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Manager"
                required
              />
            </div>
          )}

          {fields.groupCode && groups && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Group
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={formData.groupCode}
                onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
              >
                <option value="">Select Group</option>
                {groups.map((group) => (
                  <option key={group.code} value={group.code}>
                    {group.code} - {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {fields.description && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          )}

          {fields.isActive && initialData && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Check className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
