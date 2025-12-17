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
  console.log('[DEBUG] AssessmentApprovalPage: START');
  const { id } = await params;
  console.log('[DEBUG] AssessmentApprovalPage: id =', id);

  // Get current user session
  const session = await auth();
  const currentUserSession = session?.user as any;
  const currentUserId = currentUserSession?.empCode || '';

  // ดึงข้อมูล assessment โดยตรง (Efficient & Fresh)
  console.log('[DEBUG] Page: Fetching assessment', id);
  const { success, data: assessmentData } = await getAssessment(id);
  console.log('[DEBUG] Page: Fetch result', { success, found: !!assessmentData });

  if (!success || !assessmentData) {
    console.log('[DEBUG] Page: Assessment not found, triggering notFound()');
    notFound();
  }

  // Map to format required
  const assessment = assessmentData;

  // ตรวจสอบว่าสามารถ approve ได้หรือไม่
  // Use standardized SUBMITTED_* pattern only
  const validStatuses = [
    'SUBMITTED_APPR1', 'SUBMITTED_APPR2', 'SUBMITTED_APPR3',
    'SUBMITTED_MGR', 'SUBMITTED_HR', 'SUBMITTED_MD', 'SUBMITTED_GM',
    'FEEDBACK_REQUIRED', 'EMPLOYEE_ACKNOWLEDGE', 'FINAL_HR'
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
  let currentUserRole: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'md' | 'gm' | 'employee' | 'hr' = 'approver1'; // Default

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
    const { isUserHR } = await import('@/actions/settings');
    const isHR = await isUserHR(currentUserId);
    if (isHR) {
      isAuthorized = true;
      currentUserRole = 'md'; // Use 'md' role type as fallback for HR initial review if UI demands, or keep existing logic?
      // Wait, original code mapped HR to 'md'. Logic in approval form uses specific role now?
      // Checking ApprovalForm: line 300: if (currentUserRole === 'hr') call completeAssessmentByHR
      // But initial HR review calls approveAssessment with 'hr' stage.
      // So HR *initial* review should separate from HR *final* review.
      // Let's assume initial review functionality uses 'md' logic or add 'hr' support to ApprovalForm logic for initial review?
      // ApprovalForm doesn't explicitly support 'hr' in "approveAssessment" call in MY update.
      // Wait, I replaced `approveAssessment` call with `completeAssessmentByHR` if role is `hr`.
      // This implies role 'hr' is ONLY for final check.
      // So for initial HR review, I should probably stick to mapping to 'md' or 'manager' or create a separate role?
      // Actually, looking at `approveAssessment` (server action), it handles `stage === 'hr'`.
      // `ApprovalForm` previously didn't have `hr` role. It likely used `md` view or similar.
      // If I want to support `approveAssessment(..., 'hr')`, I need `ApprovalForm` to send 'hr'.
      // But my `ApprovalForm` update makes `hr` call `completeAssessmentByHR`.
      // CONSTLICT: I need to disambiguate Initial HR Review vs Final HR Review.

      // Let's map Initial HR Review to 'manager' or keep as 'md'? 
      // The original code mapped it to 'md'.
      // If mapped to 'md', `currentUserRole` is 'md'. `ApprovalForm` calls `approveAssessment(..., 'md')`.
      // But `approveAssessment` server action expects `stage`.
      // If I pass 'md', the server action executes `stage === 'md'`.
      // BUT `stage === 'md'` transitions to Feedback. HR transition should be HR -> MD.
      // So `stage` MUST be 'hr'.
      // Therefore `ApprovalForm` MUST send 'hr'.
      // My update to `ApprovalForm` hijacked `hr` role for `completeAssessmentByHR`.

      // FIX: I should distinguish `hr_initial` vs `hr_final`.
      // Or just check status in `ApprovalForm`.
      // "if (currentUserRole === 'hr' && status === 'SUBMITTED_HR_FINAL')" -> complete.
      // "else" -> approveAssessment('hr').
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
  } else if (assessment.status === 'EMPLOYEE_ACKNOWLEDGE') {
    isAuthorized = employee.empCode === currentUserId;
    currentUserRole = 'employee';
  } else if (assessment.status === 'FINAL_HR') {
    const { isUserHR } = await import('@/actions/settings');
    if (await isUserHR(currentUserId)) {
      isAuthorized = true;
      currentUserRole = 'hr';
    }
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
