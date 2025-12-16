import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog, Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getDelegations } from '@/actions/delegations';
import { getEmployees } from '@/actions/employees';

export const metadata = {
  title: 'Delegations | TRTH Assessment',
  description: 'Manage permission delegations',
};

export default async function DelegationsPage() {
  // Check if user is System Admin or Employee Admin
  const session = await auth();
  const currentUser = (session?.user as any);
  const role = currentUser?.role;
  const userType = currentUser?.userType;

  if (userType !== 'SYSTEM_ADMIN' && role !== 'HR') {
    redirect('/dashboard');
  }

  // Get delegations and employees
  const delegations = await getDelegations();
  const employees = await getEmployees();

  // Create employee name map
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

  const getStatusBadge = (delegation: any) => {
    const now = new Date();
    const startDate = new Date(delegation.startDate);
    const endDate = new Date(delegation.endDate);

    if (!delegation.isActive) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
          Revoked
        </span>
      );
    }

    if (now < startDate) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          Scheduled
        </span>
      );
    }

    if (now > endDate) {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Permission Delegations</h1>
            <p className="text-sm text-muted-foreground">
              Grant temporary permissions to employees
            </p>
          </div>
        </div>
        <Link href="/dashboard/delegations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Delegation
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{delegations.length}</p>
            </div>
            <UserCog className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">
                {delegations.filter((d) => {
                  const now = new Date();
                  const start = new Date(d.startDate);
                  const end = new Date(d.endDate);
                  return d.isActive && now >= start && now <= end;
                }).length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">
                {delegations.filter((d) => {
                  const now = new Date();
                  const start = new Date(d.startDate);
                  return d.isActive && now < start;
                }).length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold">
                {delegations.filter((d) => {
                  const now = new Date();
                  const end = new Date(d.endDate);
                  return d.isActive && now > end;
                }).length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delegations List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">All Delegations</h2>

        {delegations.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No delegations found</p>
            <Link href="/dashboard/delegations/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Delegation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {delegations.map((delegation) => (
              <div
                key={delegation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-medium">
                      {employeeMap.get(delegation.delegateeId) || delegation.delegateeId}
                    </p>
                    <p className="text-sm text-muted-foreground">{delegation.delegateeId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getPermissionLabel(delegation.permission)}</p>
                  </div>
                  <div>
                    <p className="text-sm">
                      {new Date(delegation.startDate).toLocaleDateString()} - {new Date(delegation.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>{getStatusBadge(delegation)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/delegations/${delegation.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
