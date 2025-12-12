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
    title: 'New Employee | TRTH Assessment',
    description: 'Create new employee',
};

export default async function NewEmployeePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const currentUser = session.user as any;
    const role = currentUser?.role;
    const userType = currentUser?.userType;

    if (userType !== 'SYSTEM_ADMIN' && role !== 'ADMIN') {
        redirect('/dashboard');
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
                <Link href="/admin/employees">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">New Employee</h1>
                    <p className="text-sm text-muted-foreground">Add a new employee to the system</p>
                </div>
            </div>

            <Card className="p-6">
                <EmployeeForm
                    mode="create"
                    allEmployees={allEmployees}
                    positions={positions}
                    groups={groups}
                    teams={teams}
                    currentUser={currentUser}
                />
            </Card>
        </div>
    );
}
