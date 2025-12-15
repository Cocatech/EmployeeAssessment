import ApprovalForm from '@/components/assessment/ApprovalForm';
import { getAssessment } from '@/actions/assessments';
import { getResponsesByAssessment } from '@/actions/responses';
import { getQuestionsByLevel } from '@/actions/questions';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentApprovalPage({ params }: Props) {
  const { id } = await params;

  // Get current user session
  const session = await auth();
  const currentUserSession = session?.user as any;
  const currentUserId = currentUserSession?.empCode || '';

  // ดึงข้อมูล assessment โดยตรง (Efficient & Fresh)
  const { success, data: assessmentData } = await getAssessment(id);

  if (!success || !assessmentData) {
    notFound();
  }

  // Map to format required
  const assessment = assessmentData;

  // ตรวจสอบว่าสามารถ approve ได้หรือไม่
  // Use standardized SUBMITTED_* pattern only
  const validStatuses = [
    'SUBMITTED_APPR1', 'SUBMITTED_APPR2', 'SUBMITTED_APPR3',
    'SUBMITTED_MGR', 'SUBMITTED_HR', 'SUBMITTED_MD', 'SUBMITTED_GM',
    'FEEDBACK_REQUIRED'
  ];

  if (!validStatuses.includes(assessment.status)) {
    redirect(`/dashboard/assessments/${id}`);
  }

  // ดึงข้อมูล employee จาก Assessment Relational Data
  const employee = assessment.employee as any;

  if (!employee) {
    return <div className="p-8 text-center text-red-600">Employee not found</div>;
  }

  // Permission check - using standardized SUBMITTED_* pattern
  let isAuthorized = false;
  let currentUserRole: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'md' | 'gm' = 'approver1'; // Default

  if (assessment.status === 'SUBMITTED_APPR1') {
    isAuthorized = employee.approver1_ID === currentUserId;
    currentUserRole = 'approver1';
  } else if (assessment.status === 'SUBMITTED_APPR2') {
    isAuthorized = employee.approver2_ID === currentUserId;
    currentUserRole = 'approver2';
  } else if (assessment.status === 'SUBMITTED_APPR3') {
    isAuthorized = employee.approver3_ID === currentUserId;
    currentUserRole = 'approver3';
  } else if (assessment.status === 'SUBMITTED_MGR') {
    isAuthorized = employee.manager_ID === currentUserId;
    currentUserRole = 'manager';
  } else if (assessment.status === 'SUBMITTED_HR') {
    // HR role can access when status is SUBMITTED_HR
    // Check if user's position code is 'HR'
    const { isUserHR } = await import('@/actions/settings');
    const isHR = await isUserHR(currentUserId);
    if (isHR) {
      isAuthorized = true;
      currentUserRole = 'md'; // Use 'md' role type as fallback for HR
    }
  } else if (assessment.status === 'SUBMITTED_MD') {
    // MD Review - check if user's position code is 'MD'
    const { isUserMD } = await import('@/actions/settings');
    const isMD = await isUserMD(currentUserId);
    if (isMD) {
      isAuthorized = true;
      currentUserRole = 'md';
    }
  } else if (assessment.status === 'SUBMITTED_GM') {
    isAuthorized = employee.gm_ID === currentUserId;
    currentUserRole = 'gm';
  } else if (assessment.status === 'FEEDBACK_REQUIRED') {
    // Manager gives feedback
    isAuthorized = employee.manager_ID === currentUserId;
    currentUserRole = 'manager';
  }

  // Redirect if not authorized
  if (!isAuthorized) {
    redirect(`/dashboard/assessments/${id}?unauthorized=true`);
  }

  // ดึงคำถามตามระดับของพนักงาน
  const questions = await getQuestionsByLevel(employee.assessmentLevel);

  // responses included in assessmentData if getAssessment includes it?
  const rawResponses = assessment.responses || await getResponsesByAssessment(id);

  // Redirect to score page which has the unified Excel-style UI
  // ScoringForm now handles all roles including approvers
  redirect(`/dashboard/assessments/${id}/score`);
}
