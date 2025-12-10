'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';

export interface Question {
  id: string;
  title: string;
  description?: string;
  category: string;
  weight: number;
  maxScore: number;
  order: number;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  disabled?: boolean;
}

export function QuestionBuilder({ questions, onChange, disabled }: QuestionBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    title: '',
    description: '',
    category: 'Technical',
    weight: 10,
    maxScore: 5,
  });

  const categories = [
    'Technical',
    'Leadership',
    'Communication',
    'Problem Solving',
    'Teamwork',
    'Quality',
    'Productivity',
    'Other',
  ];

  const handleAdd = () => {
    if (!formData.title) return;

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      category: formData.category || 'Technical',
      weight: formData.weight || 10,
      maxScore: formData.maxScore || 5,
      order: questions.length + 1,
    };

    onChange([...questions, newQuestion]);
    setFormData({
      title: '',
      description: '',
      category: 'Technical',
      weight: 10,
      maxScore: 5,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !formData.title) return;

    const updated = questions.map(q =>
      q.id === editingId
        ? {
            ...q,
            title: formData.title!,
            description: formData.description,
            category: formData.category || q.category,
            weight: formData.weight || q.weight,
            maxScore: formData.maxScore || q.maxScore,
          }
        : q
    );

    onChange(updated);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Technical',
      weight: 10,
      maxScore: 5,
    });
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setFormData({
      title: question.title,
      description: question.description,
      category: question.category,
      weight: question.weight,
      maxScore: question.maxScore,
    });
  };

  const handleDelete = (id: string) => {
    const filtered = questions.filter(q => q.id !== id);
    // Re-order remaining questions
    const reordered = filtered.map((q, index) => ({ ...q, order: index + 1 }));
    onChange(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    onChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    onChange(reordered);
  };

  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  return (
    <div className="space-y-4">
      {/* Question List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <div className="text-sm text-muted-foreground">
            Total Weight: {totalWeight}%
          </div>
        </div>

        {questions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No questions added yet. Add your first question below.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{question.title}</div>
                        {question.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {question.description}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(question)}
                          disabled={disabled}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Category: {question.category}</span>
                      <span>Weight: {question.weight}%</span>
                      <span>Max Score: {question.maxScore}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">
          {editingId ? 'Edit Question' : 'Add New Question'}
        </h4>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Question Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., How well does the employee handle technical challenges?"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details or context"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.category || 'Technical'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={disabled}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.weight || 10}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 10 })}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Score</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.maxScore || 5}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 5 })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingId ? (
              <>
                <Button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!formData.title || disabled}
                >
                  Update Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: 'Technical',
                      weight: 10,
                      maxScore: 5,
                    });
                  }}
                  disabled={disabled}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!formData.title || disabled}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            )}
          </div>
        </div>
      </Card>

      {totalWeight !== 100 && questions.length > 0 && (
        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
          ⚠️ Warning: Total weight is {totalWeight}%. It should equal 100% for accurate scoring.
        </div>
      )}
    </div>
  );
}
