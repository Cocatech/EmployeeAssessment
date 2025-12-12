'use client';

import { useState } from 'react';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { deleteEmployee } from '@/actions/employees';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  User
} from 'lucide-react';

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (empCode: string) => {
    if (!confirm(`Are you sure you want to delete employee ${empCode}?`)) {
      return;
    }

    setDeletingId(empCode);
    const result = await deleteEmployee(empCode);
    setDeletingId(null);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Code</th>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">Position</th>
              <th className="text-left py-3 px-4 font-medium">Group</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.empCode} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="font-mono text-sm">{employee.empCode}</span>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{employee.empName_Eng}</p>
                    {employee.empName_Thai && (
                      <p className="text-sm text-muted-foreground">
                        {employee.empName_Thai}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">{employee.position}</td>
                <td className="py-3 px-4 text-sm">{employee.group}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.employeeType === 'Permanent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                      }`}
                  >
                    {employee.employeeType}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  {employee.email ? (
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {employee.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`${pathname}/${employee.empCode}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/employees/${employee.empCode}/edit?returnUrl=${pathname}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.empCode)}
                      disabled={deletingId === employee.empCode}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {employees.map((employee) => (
          <div
            key={employee.empCode}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm text-muted-foreground">
                  {employee.empCode}
                </p>
                <p className="font-semibold">{employee.empName_Eng}</p>
                {employee.empName_Thai && (
                  <p className="text-sm text-muted-foreground">
                    {employee.empName_Thai}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.employeeType === 'Permanent'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
                  }`}
              >
                {employee.employeeType}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{employee.position}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{employee.group}</span>
              </div>
              {employee.team && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{employee.team}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${employee.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {employee.email}
                  </a>
                </div>
              )}
              {employee.phoneNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Link href={`${pathname}/${employee.empCode}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
              <Link href={`/admin/employees/${employee.empCode}/edit?returnUrl=${pathname}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(employee.empCode)}
                disabled={deletingId === employee.empCode}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
