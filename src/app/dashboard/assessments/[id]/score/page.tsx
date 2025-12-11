import ScoringForm from '@/components/assessment/ScoringForm';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';
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
  const assessments = await getAssessments();
  const assessment = assessments.find(a => a.id === id);

  if (!assessment) {
    notFound();
  }

  // ตรวจสอบว่าเป็น DRAFT หรือไม่
  // if (assessment.status !== 'DRAFT') {
  //   redirect(`/dashboard/assessments/${id}`);
  // }

  // ดึงข้อมูล employee
  const employees = await getEmployees();
  const employee = employees.find(e => e.empCode === assessment.employeeId);

  if (!employee) {
    return <div className="p-8 text-center text-red-600">Employee not found</div>;
  }

  // ดึงคำถามตามระดับของพนักงาน
  const questions = await getQuestionsByLevel(employee.assessmentLevel);

  // ดึงคำตอบที่มีอยู่
  const responses = await getResponsesByAssessment(id);

  return (
    <div className="container mx-auto py-6">
      <ScoringForm
        assessmentId={id}
        questions={questions}
        existingResponses={responses}
        assessmentStatus={assessment.status}
        employee={{
          empCode: employee.empCode,
          empName_Eng: employee.empName_Eng,
          position: employee.position,
          group: employee.group,
          profileImage: employee.profileImage,
        }}
      />
    </div>
  );
}
