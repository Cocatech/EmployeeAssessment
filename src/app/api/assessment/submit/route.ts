import { NextRequest, NextResponse } from 'next/server';
import { updateAssessment } from '@/actions/assessments';
import { getAssessments } from '@/actions/assessments';
import { getEmployees } from '@/actions/employees';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId } = body;

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล assessment
    const assessments = await getAssessments();
    const assessment = assessments.find(a => a.id === assessmentId);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าสามารถ Submit ได้ (Draft, Assigned, In Progress)
    const submittableStatuses = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'INPROGRESS'];
    if (!submittableStatuses.includes(assessment.status.toUpperCase())) {
      return NextResponse.json(
        { error: 'Assessment cannot be submitted in current status' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลพนักงานเพื่อเช็ค approver
    const employees = await getEmployees();
    const employee = employees.find(e => e.empCode === assessment.employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // กำหนด next status ตาม workflow
    // Flow: Self → Approver1 → Approver2 → Approver3 → Manager → GM
    let nextStatus = 'SUBMITTED_APPR1';

    // ถ้าไม่มี Approver1 ให้ข้ามไป level ถัดไป
    if (!employee.approver1_ID || employee.approver1_ID === '-') {
      if (employee.approver2_ID && employee.approver2_ID !== '-') {
        nextStatus = 'SUBMITTED_APPR2';
      } else if (employee.approver3_ID && employee.approver3_ID !== '-') {
        nextStatus = 'SUBMITTED_APPR3';
      } else if (employee.manager_ID && employee.manager_ID !== '-') {
        nextStatus = 'SUBMITTED_MGR';
      } else {
        nextStatus = 'SUBMITTED_GM';
      }
    }

    // อัปเดตสถานะ
    const updated = await updateAssessment(assessmentId, {
      status: nextStatus as any,
      submittedAt: new Date().toISOString(),
    });

    console.log('Submit assessment result:', {
      updated,
      assessmentId,
      nextStatus,
      hasManager: !!employee.approver1_ID,
      hasApprover2: !!employee.approver2_ID
    });

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      assessment: updated
    });

  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
