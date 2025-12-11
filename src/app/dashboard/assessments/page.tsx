import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Assessments | TRTH Assessment',
  description: 'Manage employee assessments',
};

export default async function DashboardAssessmentsPage() {
  // Get current user from session
  const session = await auth();
  const currentUserSession = session?.user as any;
  const role = currentUserSession?.role;
  const userType = currentUserSession?.userType;
  const currentUserId = currentUserSession?.empCode || '';

  // ดึงข้อมูลจาก database
  const assessments = await getAssessments();
  const employees = await getEmployees();

  const currentUser = employees.find(e => e.empCode === currentUserId);

  // Check if user has permission to create assessments
  // Only allow: System Admin or Employee Admin
  const isAdmin = userType === 'SYSTEM_ADMIN' || role === 'ADMIN';

  // Only Admin can create assessments
  const canCreateAssessment = isAdmin;

  // Debug logging (remove in production)
  console.log('Permission Check:', {
    currentUserId,
    empCode: currentUser?.empCode,
    isAdmin,
    canCreateAssessment
  });

  // Filter assessments based on permission
  const filteredAssessments = assessments.filter(assessment => {
    const employee = employees.find(e => e.empCode === assessment.employeeId);
    const statusUpper = assessment.status.toUpperCase();

    // Admin เห็นทั้งหมด (ทุก Draft และทุก Assessment)
    if (isAdmin) {
      return true;
    }

    // Employee sees their own assessments (Assigned, In Progress, Completed, etc.)
    if (assessment.employeeId === currentUserId) {
      return true;
    }

    if (!employee) return false;

    // Approvers see ALL assessments for employees in their approval chain
    // (except Draft which is admin-only template)
    if (statusUpper !== 'DRAFT') {
      // Is current user an approver for this employee?
      const isApprover =
        employee.approver1_ID === currentUserId ||
        employee.approver2_ID === currentUserId ||
        employee.approver3_ID === currentUserId ||
        employee.gm_ID === currentUserId;

      if (isApprover) {
        return true;
      }
    }

    return false;
  });

  // สร้าง map สำหรับหา employee info จาก empCode
  const employeeMap = new Map(
    employees.map(emp => [emp.empCode, {
      name: emp.empName_Eng,
      level: emp.assessmentLevel
    }])
  );

  // แปลงข้อมูล assessment เพื่อใช้ใน UI
  const assessmentList = filteredAssessments.map(a => ({
    id: a.id,
    title: a.title || `Assessment ${a.id.slice(0, 8)}`,
    empCode: a.employeeId,
    empName: employeeMap.get(a.employeeId)?.name || 'Unknown',
    level: employeeMap.get(a.employeeId)?.level || 'N/A',
    status: a.status,
    dueDate: a.dueDate,
    score: a.score,
  }));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      SUBMITTED_MGR: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      SUBMITTED_APPR2: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SUBMITTED_APPR3: { color: 'bg-purple-100 text-purple-800', icon: Clock },
      SUBMITTED_GM: { color: 'bg-orange-100 text-orange-800', icon: Clock },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assessment Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track employee assessments
            </p>
          </div>
        </div>
        {canCreateAssessment && (
          <Link href="/dashboard/assessments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{assessmentList.length}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">
                {assessmentList.filter((a) => a.status === 'DRAFT').length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                {assessmentList.filter((a) => a.status.startsWith('SUBMITTED')).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {assessmentList.filter((a) => a.status === 'COMPLETED').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Assessments List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">All Assessments</h2>

        {assessmentList.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No assessments found</p>
            {canCreateAssessment && (
              <Link href="/dashboard/assessments/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Assessment
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assessmentList.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-medium">{assessment.title}</p>
                    <p className="text-sm text-muted-foreground">{assessment.empCode}</p>
                  </div>
                  <div>
                    <p className="font-medium">{assessment.empName}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {assessment.level}
                    </span>
                  </div>
                  <div>{getStatusBadge(assessment.status)}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      {assessment.score && (
                        <p className="text-sm">
                          <span className="font-medium">Score:</span> {assessment.score.toFixed(1)}/5.0
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(assessment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/dashboard/assessments/${assessment.id}`}>
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
