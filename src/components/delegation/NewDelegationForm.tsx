'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserCog } from 'lucide-react';
import Link from 'next/link';
import { createDelegation } from '@/actions/delegations';
import { DelegationPermission } from '@/types/delegation';

interface NewDelegationFormProps {
  employees: Array<{ empCode: string; empName_Eng: string }>;
}

export default function NewDelegationForm({ employees }: NewDelegationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    delegateeId: '',
    permission: '' as DelegationPermission,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      const result = await createDelegation({
        delegateeId: formData.delegateeId,
        permission: formData.permission,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: formData.reason || undefined,
      });

      if (result.success) {
        router.push('/dashboard/delegations');
        router.refresh();
      } else {
        setError(result.error || 'Failed to create delegation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating delegation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const permissions = [
    { value: 'MANAGE_EMPLOYEES', label: 'Manage Employees' },
    { value: 'MANAGE_ASSESSMENTS', label: 'Manage Assessments (Admin)' },
    { value: 'VIEW_REPORTS', label: 'View All Reports' },
    { value: 'MANAGE_QUESTIONS', label: 'Manage Questions' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/delegations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">New Delegation</h1>
            <p className="text-sm text-muted-foreground">
              Grant temporary permissions to an employee
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Employee Selection */}
          <div className="space-y-2">
            <label htmlFor="delegateeId" className="text-sm font-medium">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              id="delegateeId"
              value={formData.delegateeId}
              onChange={(e) => setFormData({ ...formData, delegateeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.empCode} value={emp.empCode}>
                  {emp.empCode} - {emp.empName_Eng}
                </option>
              ))}
            </select>
          </div>

          {/* Permission Selection */}
          <div className="space-y-2">
            <label htmlFor="permission" className="text-sm font-medium">
              Permission <span className="text-red-500">*</span>
            </label>
            <select
              id="permission"
              value={formData.permission}
              onChange={(e) => setFormData({ ...formData, permission: e.target.value as DelegationPermission })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a permission...</option>
              {permissions.map((perm) => (
                <option key={perm.value} value={perm.value}>
                  {perm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              placeholder="Enter reason for this delegation..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/dashboard/delegations">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Delegation'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Information Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">About Delegations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Delegations grant temporary permissions to employees</li>
          <li>• Permissions automatically expire on the end date</li>
          <li>• You can revoke delegations at any time</li>
          <li>• Employees will only have access during the active period</li>
        </ul>
      </Card>
    </div>
  );
}
