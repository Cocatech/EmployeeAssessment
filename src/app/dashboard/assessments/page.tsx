import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
import { auth } from '@/lib/auth';
import { DeleteAssessmentButton } from '@/components/assessment/DeleteAssessmentButton';

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
  const isAdmin = userType === 'SYSTEM_ADMIN' || role === 'HR';

  // Only Admin can create assessments
  const canCreateAssessment = isAdmin;

  // Check if current user is MD
  const { getMDConfig } = await import('@/actions/settings');
  const mdCode = await getMDConfig();
  const isMD = mdCode === currentUserId;

  // Debug logging (remove in production)
  console.log('Permission Check:', {
    currentUserId,
    empCode: currentUser?.empCode,
    isAdmin,
    isMD,
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
        employee.manager_ID === currentUserId ||
        employee.gm_ID === currentUserId;

      if (isApprover) {
        return true;
      }

      // MD sees assessments with SUBMITTED_MD or SUBMITTED_HR status
      if (isMD && (statusUpper === 'SUBMITTED_MD' || statusUpper === 'SUBMITTED_HR')) {
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
  const assessmentList = filteredAssessments.map(a => {
    const employee = employees.find(e => e.empCode === a.employeeId);
    // Check if assessment is pending current user's action
    const isPendingMyAction = a.currentStage === currentUserId;

    return {
      id: a.id,
      title: a.title || `Assessment ${a.id.slice(0, 8)}`,
      empCode: a.employeeId,
      empName: employeeMap.get(a.employeeId)?.name || 'Unknown',
      level: (a.status === 'Draft' || a.status === 'DRAFT') ? a.targetLevel : (employeeMap.get(a.employeeId)?.level || 'N/A'),
      status: a.status,
      dueDate: a.dueDate,
      score: a.score,
      isPendingMyAction,
      currentStage: a.currentStage,
    };
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      Draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      Assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock },

      // Pending* pattern (new convention)
      PendingApprover1: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PendingApprover2: { color: 'bg-orange-100 text-orange-800', icon: Clock },
      PendingApprover3: { color: 'bg-purple-100 text-purple-800', icon: Clock },
      PendingManager: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      PendingMD: { color: 'bg-indigo-100 text-indigo-800', icon: Clock },
      PendingHR: { color: 'bg-pink-100 text-pink-800', icon: Clock },
      PendingGM: { color: 'bg-cyan-100 text-cyan-800', icon: Clock },
      FeedbackRequired: { color: 'bg-rose-100 text-rose-800', icon: Clock },

      // SUBMITTED_* pattern (legacy)
      SUBMITTED_APPR1: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SUBMITTED_APPR2: { color: 'bg-orange-100 text-orange-800', icon: Clock },
      SUBMITTED_APPR3: { color: 'bg-purple-100 text-purple-800', icon: Clock },
      SUBMITTED_MGR: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      SUBMITTED_HR: { color: 'bg-pink-100 text-pink-800', icon: Clock },
      SUBMITTED_MD: { color: 'bg-indigo-100 text-indigo-800', icon: Clock },
      SUBMITTED_GM: { color: 'bg-cyan-100 text-cyan-800', icon: Clock },

      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText };
    const Icon = config.icon;

    // Format display label
    const label = status.replace(/Pending/g, 'With ').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {label}
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
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors
                  ${assessment.isPendingMyAction
                    ? 'ring-2 ring-orange-400 bg-orange-50 hover:bg-orange-100'
                    : 'hover:bg-muted/50'}`}
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-medium">{assessment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {assessment.status === 'Draft' ? 'TEMPLATE' : assessment.empCode}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      {assessment.status === 'Draft' ? 'Draft Template' : assessment.empName}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {assessment.level}
                    </span>
                  </div>
                  <div>{getStatusBadge(assessment.status)}</div>
                  <div className="flex items-center justify-between gap-2">
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
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <DeleteAssessmentButton id={assessment.id} title={assessment.title} />
                      )}
                      {assessment.isPendingMyAction && (
                        <Link href={`/dashboard/assessments/${assessment.id}/approve`}>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            Approve
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/assessments/${assessment.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
  // End of DashboardAssessmentsPage component
}
