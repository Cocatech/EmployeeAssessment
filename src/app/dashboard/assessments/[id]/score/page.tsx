import ScoringForm from '@/components/assessment/ScoringForm';
import { getAssessment } from '@/actions/assessments';

import { getQuestionsByLevel } from '@/actions/questions';
import { getResponsesByAssessment } from '@/actions/responses';
import { notFound, redirect } from 'next/navigation';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssessmentScoringPage({ params }: Props) {
  const { id } = await params;

  // ดึงข้อมูล assessment
  const assessResult = await getAssessment(id);

  if (!assessResult.success || !assessResult.data) {
    notFound();
  }

  const assessment = assessResult.data;

  // ตรวจสอบว่าเป็น DRAFT หรือไม่
  // if (assessment.status !== 'DRAFT') {
  //   redirect(`/dashboard/assessments/${id}`);
  // }

  // ดึงข้อมูล employee จาก assessment result โดยตรง (ไม่ต้อง fetch ใหม่)
  // เพราะ getAssessment ทำการ enrich approver positions มาให้แล้ว
  const employee = assessment.employee;

  if (!employee) {
    return <div className="p-8 text-center text-red-600">Employee not found</div>;
  }

  // ดึงคำถามตามระดับของพนักงาน
  // ใช้ targetLevel จาก assessment ก่อน ถ้าไม่มีค่อยใช้ employee.assessmentLevel
  const targetLevel = (assessment as any).targetLevel || employee.assessmentLevel;
  const questions = await getQuestionsByLevel(targetLevel);

  // ดึงคำตอบที่มีอยู่
  const responses = await getResponsesByAssessment(id);

  return (
    <div className="container mx-auto py-6">
      <ScoringForm
        assessment={assessment}
        employee={employee}
        questions={questions}
        existingResponses={responses}
      />
    </div>
  );
}
