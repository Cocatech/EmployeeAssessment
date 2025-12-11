import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPositions, getGroups, getTeams } from '@/actions/settings';
import { getEmployees } from '@/actions/employees';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Add Employee | TRTH Assessment',
  description: 'Create a new employee record',
};

export default async function NewEmployeePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const [positions, groups, teams, employees] = await Promise.all([
    getPositions(),
    getGroups(),
    getTeams(),
    getEmployees(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/employees">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add New Employee</h1>
              <p className="text-sm text-muted-foreground">
                Create a new employee record
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <EmployeeForm
          mode="create"
          positions={positions}
          groups={groups}
          teams={teams}
          allEmployees={employees}
        />
      </Card>
    </div>
  );
}
