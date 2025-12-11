import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, Users, Trash2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
import { getResponsesByAssessment } from '@/actions/responses';
import { getQuestionsByLevel } from '@/actions/questions';
import { notFound } from 'next/navigation';
import { DraftActions } from '@/components/assessment/DraftActions';
import { auth } from '@/lib/auth';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentDetailPage({ params }: Props) {
  const { id } = await params;

  // ดึงข้อมูล assessment
  const assessments = await getAssessments();
  const assessment = assessments.find(a => a.id === id);

  if (!assessment) {
    notFound();
  }

  // Get current user session for permission check
  const session = await auth();
  const currentUserSession = session?.user as any;
  const role = currentUserSession?.role;
  const userType = currentUserSession?.userType;
  const currentUserId = currentUserSession?.empCode || '';
  const isAdmin = userType === 'SYSTEM_ADMIN' || role === 'ADMIN';

  // Check if current user is the owner of this assessment
  const isOwner = assessment.employeeId === currentUserId;
  const statusUpper = assessment.status.toUpperCase();

  // ดึงข้อมูล employee
  const employees = await getEmployees();
  const employee = employees.find(e => e.empCode === assessment.employeeId);

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' },
      SUBMITTED_APPR1: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'With Approver 1' },
      SUBMITTED_APPR2: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'With Approver 2' },
      SUBMITTED_APPR3: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'With Approver 3' },
      SUBMITTED_MGR: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'With Manager' },
      SUBMITTED_GM: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'With MD' },
      COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      REJECTED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100', label: status };

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

            {/* GM/MD Review */}
            {assessment.status === 'SUBMITTED_GM' && employee?.gm_ID === currentUserId && (
              <Link href={`/dashboard/assessments/${id}/approve`}>
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  MD Review
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

      {/* Assessment Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Assessment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assessment Type:</span>
              <span className="font-medium">{assessment.assessmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period:</span>
              <span className="font-medium">
                {formatDate(assessment.periodStart)} - {formatDate(assessment.periodEnd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">{formatDate(assessment.dueDate)}</span>
            </div>
            {assessment.submittedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{formatDate(assessment.submittedAt)}</span>
              </div>
            )}
            {assessment.score !== null && assessment.score !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium text-lg">{assessment.score.toFixed(2)} / 5.00</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Employee Information</h2>
          <div className="flex gap-4 items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {employee?.profileImage ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={employee.profileImage}
                    alt={employee.empName_Eng}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border text-gray-500 text-xl font-bold">
                  {employee?.empName_Eng?.charAt(0) || 'E'}
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{employee?.empName_Eng}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="text-muted-foreground">Position:</span>
                <span className="font-medium">{employee?.position}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="text-muted-foreground">Group:</span>
                <span className="font-medium">{employee?.group}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="text-muted-foreground">Level:</span>
                <span className="font-medium">{employee?.assessmentLevel}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{employee?.employeeType}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Questions and Responses */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Assessment Questions & Scores</h2>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No questions found for this assessment level
          </div>
        ) : (
          <div className="space-y-4 min-w-[800px]">
            {questions
              .sort((a, b) => a.order - b.order)
              .map((question) => {
                const response = responseMap.get(question.id);
                // Type casting because responses from action might not strictly match the interface yet if not updated
                const anyResponse = response as any;

                return (
                  <div
                    key={question.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{question.questionTitle}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                            {question.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Weight: {question.weight}%
                          </span>
                        </div>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Scores - Only show for non-Draft assessments */}
                    {statusUpper !== 'DRAFT' && (
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3 pt-3 border-t">
                        {/* 1. Self */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 font-semibold text-blue-600">Self</p>
                          <p className="text-lg font-bold">
                            {anyResponse?.scoreSelf ?? '-'}
                          </p>
                        </div>
                        {/* 2. Approver 1 */}
                        {!isOwner && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-semibold text-green-600">Appr 1</p>
                            <p className="text-lg font-bold">
                              {anyResponse?.scoreAppr1 ?? '-'}
                            </p>
                          </div>
                        )}
                        {/* 3. Approver 2 */}
                        {!isOwner && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-semibold text-yellow-600">Appr 2</p>
                            <p className="text-lg font-bold">
                              {anyResponse?.scoreAppr2 ?? '-'}
                            </p>
                          </div>
                        )}
                        {/* 4. Approver 3 */}
                        {!isOwner && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-semibold text-purple-600">Appr 3</p>
                            <p className="text-lg font-bold">
                              {anyResponse?.scoreAppr3 ?? '-'}
                            </p>
                          </div>
                        )}
                        {/* Manager & GM Scores hidden by requirement */}
                      </div>
                    )}

                    {/* Comments - Compact View */}
                    {(anyResponse?.commentSelf || anyResponse?.commentAppr1 || anyResponse?.commentAppr2 || anyResponse?.commentAppr3 || anyResponse?.commentMgr || anyResponse?.commentGm) && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {anyResponse?.commentSelf && <p><span className="font-semibold text-blue-600">Self:</span> {anyResponse.commentSelf}</p>}
                        {anyResponse?.commentAppr1 && <p><span className="font-semibold text-green-600">Appr1:</span> {anyResponse.commentAppr1}</p>}
                        {anyResponse?.commentAppr2 && <p><span className="font-semibold text-yellow-600">Appr2:</span> {anyResponse.commentAppr2}</p>}
                        {anyResponse?.commentAppr3 && <p><span className="font-semibold text-purple-600">Appr3:</span> {anyResponse.commentAppr3}</p>}
                        {anyResponse?.commentMgr && <p><span className="font-semibold text-orange-600">Mgr:</span> {anyResponse.commentMgr}</p>}
                        {anyResponse?.commentGm && <p><span className="font-semibold text-red-600">MD:</span> {anyResponse.commentGm}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Summary - Only show for non-Draft assessments with responses */}
      {assessment.status.toUpperCase() !== 'DRAFT' && responses.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Summary Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
              <p className="text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Answered</p>
              <p className="text-2xl font-bold">{responses.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <p className="text-2xl font-bold">
                {questions.length > 0
                  ? Math.round((responses.length / questions.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
