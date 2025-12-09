import { getEmployees, getDepartments } from '@/actions/employees';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeeFilters } from '@/components/employees/EmployeeFilters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

export const metadata = {
  title: 'Employees | TRTH Assessment',
  description: 'Manage employee records',
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { 
    search?: string; 
    department?: string; 
    type?: string;
  };
}) {
  const [employees, departments] = await Promise.all([
    getEmployees(),
    getDepartments(),
  ]);

  // Filter employees based on search params
  let filteredEmployees = employees;

  if (searchParams.search) {
    const query = searchParams.search.toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (emp) =>
        emp.empCode.toLowerCase().includes(query) ||
        emp.empName_Eng.toLowerCase().includes(query) ||
        emp.empName_Thai?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query)
    );
  }

  if (searchParams.department) {
    filteredEmployees = filteredEmployees.filter(
      (emp) => emp.department === searchParams.department
    );
  }

  if (searchParams.type) {
    filteredEmployees = filteredEmployees.filter(
      (emp) => emp.employeeType === searchParams.type
    );
  }

  const stats = {
    total: filteredEmployees.length,
    permanent: filteredEmployees.filter((e) => e.employeeType === 'Permanent').length,
    temporary: filteredEmployees.filter((e) => e.employeeType === 'Temporary').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee records and information
          </p>
        </div>
        <Link href="/admin/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Permanent Staff</p>
              <p className="text-2xl font-bold">{stats.permanent}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temporary Staff</p>
              <p className="text-2xl font-bold">{stats.temporary}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <EmployeeFilters departments={departments} />
      </Card>

      {/* Employee Table */}
      <Card className="p-6">
        <EmployeeTable employees={filteredEmployees} />
      </Card>
    </div>
  );
}
