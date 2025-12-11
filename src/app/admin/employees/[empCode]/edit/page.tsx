import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getPositions, getGroups, getTeams } from '@/actions/settings';
import { EmployeeForm } from '@/components/employees/EmployeeForm';

export const metadata = {
  title: 'Edit Employee | TRTH Assessment',
  description: 'Edit employee information',
};

export default async function EditEmployeePage({
  params
}: {
  params: Promise<{ empCode: string }>
}) {
  const { empCode } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const currentUser = session.user as any;
  const role = currentUser?.role;
  const userType = currentUser?.userType;

  // Only System Admin or Employee Admin can access
  if (userType !== 'SYSTEM_ADMIN' && role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const employee = await prisma.employee.findUnique({
    where: { empCode },
  });

  if (!employee) {
    redirect('/admin/employees');
  }

  // Get all employees for approver selection
  const [allEmployees, positions, groups, teams] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      select: { empCode: true, empName_Eng: true, position: true },
      orderBy: { empCode: 'asc' },
    }),
    getPositions(),
    getGroups(),
    getTeams(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/admin/employees/${empCode}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <p className="text-sm text-muted-foreground">{employee.empCode} - {employee.empName_Eng}</p>
        </div>
      </div>

      <Card className="p-6">
        <EmployeeForm
          mode="edit"
          employee={employee}
          allEmployees={allEmployees}
          positions={positions}
          groups={groups}
          teams={teams}
        />
      </Card>
    </div>
  );
}
