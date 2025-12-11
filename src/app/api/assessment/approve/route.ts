import { NextRequest, NextResponse } from 'next/server';
import { updateAssessment } from '@/actions/assessments';
import { getAssessments } from '@/actions/assessments';
// Legacy route - use new workflow actions instead
// import { calculateAssessmentScore } from '@/actions/responses';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, action } = body;

    if (!assessmentId || !action) {
      return NextResponse.json(
        { error: 'Assessment ID and action are required' },
        { status: 400 }
      );
    }

    // 1. Fetch assessment and employee data
    const assessments = await getAssessments();
    const assessment = assessments.find(a => a.id === assessmentId);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Get full employee details (need approver chain)
    // In a real app, this should be a DB join. Here we simulate fetching.
    // Note: getAssessments might not return full employee object with all approver IDs
    // so we might need to fetch employee separately if needed, but let's assume availability or fetch strictly
    const { getEmployees } = await import('@/actions/employees');
    const employees = await getEmployees();
    const employee = employees.find(e => e.empCode === assessment.employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // 2. Helper to determine next level
    const determineNextStatus = (currentStatus: string): string => {
      // Flow: ... -> SUBMITTED_APPR1 -> SUBMITTED_APPR2 -> SUBMITTED_APPR3 -> SUBMITTED_MGR -> SUBMITTED_GM -> COMPLETED

      let next = 'COMPLETED';

      // Determine logical next steps based on current status
      switch (currentStatus) {
        case 'SUBMITTED_APPR1':
          // Check Appr2
          if (employee.approver2_ID && employee.approver2_ID !== '-') return 'SUBMITTED_APPR2';
        // Fall through to check Appr3

        case 'SUBMITTED_APPR2':
          // Check Appr3
          if (employee.approver3_ID && employee.approver3_ID !== '-') return 'SUBMITTED_APPR3';
        // Fall through to check Manager

        case 'SUBMITTED_APPR3':
          // Check Manager
          if (employee.manager_ID && employee.manager_ID !== '-') return 'SUBMITTED_MGR';
        // Fall through to check GM

        case 'SUBMITTED_MGR':
          // Check GM (Always exists? or check)
          if (employee.gm_ID && employee.gm_ID !== '-') return 'SUBMITTED_GM';
          return 'COMPLETED'; // If no GM, complete (unlikely)

        case 'SUBMITTED_GM':
          return 'COMPLETED';

        default:
          return 'COMPLETED';
      }
    };

    if (action === 'reject') {
      const updated = await updateAssessment(assessmentId, {
        status: 'REJECTED',
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Assessment rejected',
        assessment: updated
      });
    }

    if (action === 'approve') {
      const currentStatus = assessment.status;
      const nextStatus = determineNextStatus(currentStatus);

      const updateData: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      // Set completion stamps if finished
      if (nextStatus === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString();
        // Here you would copy the final score to 'finalScore'
      }

      // Update specific approver timestamps/statuses could be added here
      // e.g., Set approvedByAppr1 = true, etc. based on currentStatus

      const updated = await updateAssessment(assessmentId, updateData);

      return NextResponse.json({
        success: true,
        message: `Assessment approved: ${currentStatus} -> ${nextStatus}`,
        assessment: updated,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing assessment approval:', error);
    return NextResponse.json(
      { error: 'Failed to process assessment' },
      { status: 500 }
    );
  }
}
