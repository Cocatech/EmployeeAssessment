import { redirect, notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCog, Calendar, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getDelegations } from '@/actions/delegations';
import { getEmployees } from '@/actions/employees';
import DelegationActions from '@/components/delegation/DelegationActions';

export const metadata = {
  title: 'Delegation Details | TRTH Assessment',
  description: 'View delegation details',
};

export default async function DelegationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if user is admin
  const session = await auth();
  const currentUser = (session?.user as any);
  const role = currentUser?.role;
  const userType = currentUser?.userType;
  
  if (userType !== 'SYSTEM_ADMIN' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get delegation
  const delegations = await getDelegations();
  const delegation = delegations.find((d) => d.id === params.id);

  if (!delegation) {
    notFound();
  }

  // Get employees
  const employees = await getEmployees();
  const employeeMap = new Map(
    employees.map(emp => [emp.empCode, emp.empName_Eng])
  );

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      MANAGE_EMPLOYEES: 'Manage Employees',
      MANAGE_ASSESSMENTS: 'Manage Assessments (Admin)',
      VIEW_REPORTS: 'View All Reports',
      MANAGE_QUESTIONS: 'Manage Questions',
    };
    return labels[permission] || permission;
  };

  const getStatusBadge = () => {
    const now = new Date();
    const startDate = new Date(delegation.startDate);
    const endDate = new Date(delegation.endDate);
    
    if (!delegation.isActive) {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800">
          Revoked
        </span>
      );
    }
    
    if (now < startDate) {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800">
          Scheduled
        </span>
      );
    }
    
    if (now > endDate) {
      return (
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-red-100 text-red-800">
          Expired
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold">Delegation Details</h1>
              <p className="text-sm text-muted-foreground">
                View and manage delegation
              </p>
            </div>
          </div>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Delegation Info */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Employee Info */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Delegated To</h3>
              <p className="text-lg font-medium">
                {employeeMap.get(delegation.delegateeId) || delegation.delegateeId}
              </p>
              <p className="text-sm text-muted-foreground">{delegation.delegateeId}</p>
            </div>
          </div>

          {/* Permission Info */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Permission</h3>
              <p className="text-lg font-medium">{getPermissionLabel(delegation.permission)}</p>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Active Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                  <p className="font-medium">
                    {new Date(delegation.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-medium">
                    {new Date(delegation.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          {delegation.reason && (
            <div>
              <h3 className="font-semibold mb-2">Reason</h3>
              <p className="text-muted-foreground">{delegation.reason}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Created By</p>
                <p className="font-medium">
                  {employeeMap.get(delegation.delegatorId) || delegation.delegatorId}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Created At</p>
                <p className="font-medium">
                  {new Date(delegation.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {delegation.revokedAt && (
                <>
                  <div>
                    <p className="text-muted-foreground mb-1">Revoked By</p>
                    <p className="font-medium">
                      {employeeMap.get(delegation.revokedBy || '') || delegation.revokedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Revoked At</p>
                    <p className="font-medium">
                      {new Date(delegation.revokedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <DelegationActions delegation={delegation} />
    </div>
  );
}
