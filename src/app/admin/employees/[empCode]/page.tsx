import { getEmployee } from '@/actions/employees';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Edit, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Calendar,
  User,
  Users,
  Shield,
  ArrowLeft
} from 'lucide-react';

export default async function EmployeeDetailPage({
  params,
}: {
  params: { empCode: string };
}) {
  const result = await getEmployee(params.empCode);

  if (!result.success || !result.data) {
    notFound();
  }

  const employee = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/employees">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.empName_Eng}
            </h1>
            <p className="text-muted-foreground mt-1">
              {employee.empCode} • {employee.position}
            </p>
          </div>
        </div>
        <Link href={`/admin/employees/${employee.empCode}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Employee Code</p>
                <p className="font-mono">{employee.empCode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">English Name</p>
                <p className="font-medium">{employee.empName_Eng}</p>
              </div>
            </div>

            {employee.empName_Thai && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Thai Name</p>
                  <p className="font-medium">{employee.empName_Thai}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{employee.position}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Assessment Level</p>
                <p className="font-medium">{employee.assessmentLevel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Employee Type</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.employeeType === 'Permanent'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {employee.employeeType}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Join Date</p>
                <p className="font-medium">
                  {new Date(employee.joinDate).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            {employee.email ? (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${employee.email}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-muted-foreground italic">Not provided</p>
                </div>
              </div>
            )}

            {employee.phoneNumber ? (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <a
                    href={`tel:${employee.phoneNumber}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {employee.phoneNumber}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-muted-foreground italic">Not provided</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Approval Hierarchy */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Approval Hierarchy</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Manager (Approver 1)</p>
              <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                {employee.approver1_ID}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Approver 2</p>
              <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                {employee.approver2_ID || '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">GM</p>
              <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                {employee.gm_ID}
              </p>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Warning Count</p>
              <p className="text-2xl font-bold">
                {employee.warningCount}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
