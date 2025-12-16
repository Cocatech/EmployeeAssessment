import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, Users, Trash2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { getAssessments, getAssessment } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
import { getResponsesByAssessment } from '@/actions/responses';
import { getQuestionsByLevel } from '@/actions/questions';
import { notFound } from 'next/navigation';
import { DraftActions } from '@/components/assessment/DraftActions';
import { AssessmentExcelView } from '@/components/assessment/AssessmentExcelView';
import { auth } from '@/lib/auth';
import { getSystemSettings, isUserHR, isUserMD } from '@/actions/settings';
import { getAssessmentLevels } from '@/actions/levels';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentDetailPage({ params }: Props) {
  const { id } = await params;

  // ดึงข้อมูล assessment โดยใช้ getAssessment (singular) เพื่อให้ได้ employee ที่ enrich data แล้ว
  const assessmentResult = await getAssessment(id);

  if (!assessmentResult.success || !assessmentResult.data) {
    notFound();
  }

  const assessment = assessmentResult.data;

  // Get current user session for permission check
  const session = await auth();
  const currentUserSession = session?.user as any;
  const role = currentUserSession?.role;
  const userType = currentUserSession?.userType;
  const currentUserId = currentUserSession?.empCode || '';
  const isAdmin = userType === 'SYSTEM_ADMIN' || role === 'HR';

  // Check if current user is the owner of this assessment
  const isOwner = assessment.employeeId === currentUserId;
  const statusUpper = assessment.status.toUpperCase();

  // ดึงข้อมูล employee จาก assessment result โดยตรง (ไม่ต้อง fetch ใหม่)
  // เพราะ getAssessment ทำการ enrich approver positions มาให้แล้ว
  const employee = assessment.employee;

  // ดึงคำถามตาม targetLevel ของ assessment (ใช้ targetLevel ที่เก็บใน assessment)
  // ถ้าไม่มี targetLevel ให้ใช้ employee.assessmentLevel เป็น fallback
  const targetLevel = (assessment as any).targetLevel || employee?.assessmentLevel || '';
  const questions = targetLevel
    ? await getQuestionsByLevel(targetLevel)
    : [];

  // ดึงคำตอบที่มีอยู่
  const responses = await getResponsesByAssessment(id);

  // สร้าง map สำหรับหาคำตอบแต่ละคำถาม
  const responseMap = new Map(
    responses.map(r => [r.questionId, r])
  );

  const settings = await getSystemSettings();
  const formLogo = settings.form_logo;

  // Check if current user is HR or MD based on their position code
  const isCurrentUserHR = await isUserHR(currentUserId);
  const isCurrentUserMD = await isUserMD(currentUserId);

  const levels = await getAssessmentLevels();
  const currentLevel = levels.find(l => l.code === targetLevel);
  // Prioritize Level-specific title, then Global setting (legacy), then default
  const assessmentTitle = currentLevel?.formTitle || settings.assessment_title;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' },
      Draft: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' },
      Assigned: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Assigned' },

      // Pending* pattern - new convention
      PendingApprover1: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'With Approver 1' },
      PendingApprover2: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'With Approver 2' },
      PendingApprover3: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'With Approver 3' },
      PendingManager: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'With Manager' },
      PendingMD: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'With MD' },
      PendingHR: { color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'With HR' },
      PendingGM: { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', label: 'With GM' },
      FeedbackRequired: { color: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Feedback Required' },

      // SUBMITTED_* pattern - legacy
      SUBMITTED_APPR1: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'With Approver 1' },
      SUBMITTED_APPR2: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'With Approver 2' },
      SUBMITTED_APPR3: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'With Approver 3' },
      SUBMITTED_MGR: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'With Manager' },
      SUBMITTED_GM: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'With MD' },

      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/assessments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{assessment.title || `Assessment ${id}`}</h1>
              {getStatusBadge(assessment.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {employee?.empCode} - {employee?.empName_Eng}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Admin-only Draft Actions - Assign and Delete */}
          {isAdmin && statusUpper === 'DRAFT' && targetLevel && (
            <DraftActions
              assessmentId={id}
              targetLevel={targetLevel}
            />
          )}

          {/* Admin can edit Draft */}
          {isAdmin && statusUpper === 'DRAFT' && (
            <div className="flex gap-2">
              <Link href={`/dashboard/assessments/${id}/score`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Questions
                </Button>
              </Link>
            </div>
          )}

          {/* Employee can Start Assessment when status is Assigned */}
          {isOwner && statusUpper === 'ASSIGNED' && (
            <Link href={`/dashboard/assessments/${id}/score`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Assessment
              </Button>
            </Link>
          )}

          {/* Employee can Continue Assessment when status is In Progress */}
          {isOwner && ['IN_PROGRESS', 'INPROGRESS'].includes(statusUpper) && (
            <Link href={`/dashboard/assessments/${id}/score`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Continue Assessment
              </Button>
            </Link>
          )}

          {/* Other status actions for approvers - Only show to the CORRECT approver */}
          <div className="flex gap-2">

            {/* Approver 1 Review */}
            {assessment.status === 'SUBMITTED_APPR1' && employee?.approver1_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Review & Approve
                </Button>
              </Link>
            )}

            {/* Approver 2 Review */}
            {assessment.status === 'SUBMITTED_APPR2' && employee?.approver2_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Review & Approve
                </Button>
              </Link>
            )}

            {/* Approver 3 Review */}
            {assessment.status === 'SUBMITTED_APPR3' && employee?.approver3_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Review & Approve
                </Button>
              </Link>
            )}

            {/* Manager Review */}
            {assessment.status === 'SUBMITTED_MGR' && employee?.manager_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Review & Approve
                </Button>
              </Link>
            )}

            {/* HR Review - Only show to HR users */}
            {assessment.status === 'SUBMITTED_HR' && isCurrentUserHR && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  HR Review & Verify
                </Button>
              </Link>
            )}

            {/* MD Review - Only show to MD users */}
            {assessment.status === 'SUBMITTED_MD' && isCurrentUserMD && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  MD Review & Approve
                </Button>
              </Link>
            )}

            {/* GM Review */}
            {assessment.status === 'SUBMITTED_GM' && employee?.gm_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  GM Confirm
                </Button>
              </Link>
            )}

            {/* Feedback Required */}
            {assessment.status === 'FEEDBACK_REQUIRED' && employee?.manager_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Feedback
                </Button>
              </Link>
            )}

            {assessment.status === 'COMPLETED' && (
              <Link href={`/dashboard/assessments/${id}/summary`}>
                <Button variant="outline">
                  View Summary
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {employee && (
        <AssessmentExcelView
          assessment={assessment}
          employee={employee}
          questions={questions}
          responses={responseMap}
          currentUserId={currentUserId}
          isOwner={isOwner}
          userRole={role}
          formLogo={formLogo}
          assessmentTitle={assessmentTitle}
        />
      )}
    </div>
  );
}
