'use client';

import { useState } from 'react';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteEmployee } from '@/actions/employees';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Briefcase, 
  Building,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

interface EmployeeCardViewProps {
  employees: Employee[];
}

export function EmployeeCardView({ employees }: EmployeeCardViewProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleDelete = async (empCode: string) => {
    if (!confirm(`Are you sure you want to delete employee ${empCode}?`)) {
      return;
    }

    setDeletingId(empCode);
    const result = await deleteEmployee(empCode);
    setDeletingId(null);

    if (result.success) {
      setSelectedEmployee(null);
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No employees found</p>
      </div>
    );
  }

  return (
    <>
      {/* Card Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <Card 
            key={employee.empCode}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedEmployee(employee)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {employee.empCode}
                    </span>
                    {!employee.isActive && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg truncate">
                    {employee.empName_Eng}
                  </h3>
                  {employee.empName_Thai && (
                    <p className="text-sm text-muted-foreground truncate">
                      {employee.empName_Thai}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                    employee.employeeType === 'Permanent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {employee.employeeType}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{employee.position}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {employee.group} {employee.team && `/ ${employee.team}`}
                  </span>
                </div>
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-blue-600 truncate text-xs">
                      {employee.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning Badge */}
              {employee.warningCount > 0 && (
                <div className="flex items-center gap-2 text-orange-600 text-xs bg-orange-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{employee.warningCount} Warning{employee.warningCount > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEmployee(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedEmployee.empName_Eng}</h2>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.empCode}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedEmployee(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEmployee.employeeType === 'Permanent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {selectedEmployee.employeeType}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEmployee.isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                </span>
                {selectedEmployee.warningCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {selectedEmployee.warningCount} Warning{selectedEmployee.warningCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">English Name</p>
                    <p className="font-medium">{selectedEmployee.empName_Eng}</p>
                  </div>
                  {selectedEmployee.empName_Thai && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Thai Name</p>
                      <p className="font-medium">{selectedEmployee.empName_Thai}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee Code</p>
                    <p className="font-mono font-medium">{selectedEmployee.empCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Position</p>
                    <p className="font-medium">{selectedEmployee.position}</p>
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Organization</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Group</p>
                    <p className="font-medium">{selectedEmployee.group}</p>
                  </div>
                  {selectedEmployee.team && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Team</p>
                      <p className="font-medium">{selectedEmployee.team}</p>
                    </div>
                  )}
                  {selectedEmployee.assessmentLevel && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assessment Level</p>
                      <p className="font-medium">{selectedEmployee.assessmentLevel}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Contact Information</h3>
                <div className="space-y-3">
                  {selectedEmployee.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedEmployee.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedEmployee.email}
                      </a>
                    </div>
                  )}
                  {selectedEmployee.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`tel:${selectedEmployee.phoneNumber}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedEmployee.phoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Approvers */}
              {(selectedEmployee.approver1_ID || selectedEmployee.approver2_ID || selectedEmployee.approver3_ID) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Approval Chain</h3>
                  <div className="space-y-2">
                    {selectedEmployee.approver1_ID && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-muted-foreground">Manager:</span>
                        <span className="font-medium">{selectedEmployee.approver1_ID}</span>
                      </div>
                    )}
                    {selectedEmployee.approver2_ID && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span className="text-muted-foreground">Approver 2:</span>
                        <span className="font-medium">{selectedEmployee.approver2_ID}</span>
                      </div>
                    )}
                    {selectedEmployee.approver3_ID && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">General Manager:</span>
                        <span className="font-medium">{selectedEmployee.approver3_ID}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Employment Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Join Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatDate(selectedEmployee.joinDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </Button>
              <Link href={`/admin/employees/${selectedEmployee.empCode}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() => handleDelete(selectedEmployee.empCode)}
                disabled={deletingId === selectedEmployee.empCode}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingId === selectedEmployee.empCode ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
