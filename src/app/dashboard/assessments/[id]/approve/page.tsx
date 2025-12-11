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
  if (!['SUBMITTED_APPR1', 'SUBMITTED_APPR2', 'SUBMITTED_APPR3', 'SUBMITTED_MGR', 'SUBMITTED_GM'].includes(assessment.status)) {
    redirect(`/dashboard/assessments/${id}`);
  }

  // ดึงข้อมูล employee จาก Assessment Relational Data
  const employee = assessment.employee as any; // Type assertion if needed

  if (!employee) {
    return <div className="p-8 text-center text-red-600">Employee not found</div>;
  }

  // Permission check - only the correct approver can access this page
  let isAuthorized = false;
  let currentUserRole: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'gm' = 'approver1';

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
  } else if (assessment.status === 'SUBMITTED_GM') {
    isAuthorized = employee.gm_ID === currentUserId;
    currentUserRole = 'gm';
  }

  // Redirect if not authorized
  if (!isAuthorized) {
    redirect(`/dashboard/assessments/${id}?unauthorized=true`);
  }

  // ดึงคำถามตามระดับของพนักงาน
  const questions = await getQuestionsByLevel(employee.assessmentLevel);

  // responses included in assessmentData if getAssessment includes it?
  const rawResponses = assessment.responses || await getResponsesByAssessment(id);

  // Convert nulls to undefined to match Response interface if needed
  const responses = rawResponses.map((r: any) => ({
    ...r,
    scoreSelf: r.scoreSelf ?? undefined,
    scoreAppr1: r.scoreAppr1 ?? undefined,
    scoreAppr2: r.scoreAppr2 ?? undefined,
    scoreAppr3: r.scoreAppr3 ?? undefined,
    scoreMgr: r.scoreMgr ?? undefined,
    scoreGm: r.scoreGm ?? undefined,
  }));

  return (
    <div className="container mx-auto py-6">
      <ApprovalForm
        assessmentId={id}
        assessmentStatus={assessment.status}
        employee={{
          empCode: employee.empCode,
          empName_Eng: employee.empName_Eng,
          position: employee.position,
          group: employee.group,
          profileImage: employee.profileImage,
        }}
        questions={questions}
        responses={responses}
        currentUserRole={currentUserRole}
        approver1Id={employee.approver1_ID}
        approver2Id={employee.approver2_ID}
        approver3Id={employee.approver3_ID}
        managerId={employee.manager_ID}
        gmId={employee.gm_ID}
      />
    </div>
  );
}
