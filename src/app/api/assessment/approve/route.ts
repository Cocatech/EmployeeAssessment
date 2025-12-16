import { NextRequest, NextResponse } from 'next/server';
import { updateAssessment } from '@/actions/assessments';
import { getAssessments } from '@/actions/assessments';
import { logAudit, AuditAction } from '@/lib/audit'; // Import audit logger
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
    // Get full employee details (need approver chain)
    const { getEmployee } = await import('@/actions/employees');
    const empResult = await getEmployee(assessment.employeeId);

    if (!empResult.success || !empResult.data) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    const employee = empResult.data;

    // 2. Helper to determine next level
    const determineNextStatus = (currentStatus: string): string => {
      // Flow: ... -> SUBMITTED_APPR1 -> SUBMITTED_APPR2 -> SUBMITTED_APPR3 -> SUBMITTED_MGR -> SUBMITTED_HR -> SUBMITTED_MD -> COMPLETED
      // Note: GM step is replaced/integrated into this new flow or specific to customer config. 
      // We strictly follow the requested Manager -> HR -> MD flow here.

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
          // If no Manager, go to HR
          return 'SUBMITTED_HR';

        case 'SUBMITTED_MGR':
          // Manager -> HR
          return 'SUBMITTED_HR';

        case 'SUBMITTED_HR':
          // HR -> MD
          return 'SUBMITTED_MD';

        case 'SUBMITTED_MD':
          // MD -> Feedback Required (Manager)
          return 'FEEDBACK_REQUIRED';

        case 'FEEDBACK_REQUIRED':
          // Manager confirms feedback -> GM
          return 'SUBMITTED_GM';

        case 'SUBMITTED_GM':
          // GM -> Completed
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

      // [AUDIT LOG]
      await logAudit(
        'ASSESSMENT_REJECT',
        'Assessment',
        assessmentId,
        {
          action: 'Reject',
          previousStatus: assessment.status,
          reason: 'Rejected via API'
        }
      );

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

      const now = new Date();

      // Timestamp logic logic
      if (currentStatus === 'SUBMITTED_APPR1') updateData.approver1Date = now;
      if (currentStatus === 'SUBMITTED_APPR2') updateData.approver2Date = now;
      if (currentStatus === 'SUBMITTED_APPR3') updateData.approver3Date = now;
      if (currentStatus === 'SUBMITTED_MGR') {
        updateData.managerDate = now;
        updateData.hrStatus = 'Pending'; // HR is next
      }
      if (currentStatus === 'SUBMITTED_HR') {
        updateData.hrDate = now;
        updateData.hrStatus = 'Approved';
        updateData.mdStatus = 'Pending'; // MD is next
      }
      if (currentStatus === 'SUBMITTED_MD') {
        updateData.mdDate = now;
        updateData.mdStatus = 'Approved';
      }

      if (currentStatus === 'FEEDBACK_REQUIRED') {
        updateData.feedbackDate = now;
      }

      if (currentStatus === 'SUBMITTED_GM') {
        updateData.gmDate = now;
        updateData.approvedAt = now;
        updateData.completedAt = now;
      }

      if (nextStatus === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString();
        // Here you would copy the final score to 'finalScore'
      }
      if (nextStatus === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString();
        // Here you would copy the final score to 'finalScore'
      }

      // Update specific approver timestamps/statuses could be added here
      // e.g., Set approvedByAppr1 = true, etc. based on currentStatus

      const updated = await updateAssessment(assessmentId, updateData);

      // [AUDIT LOG] Determine specific action type based on status
      let auditAction: AuditAction = 'ASSESSMENT_UPDATE';
      if (currentStatus === 'SUBMITTED_APPR1') auditAction = 'ASSESSMENT_APPROVE_APPR1';
      else if (currentStatus === 'SUBMITTED_APPR2') auditAction = 'ASSESSMENT_APPROVE_APPR2';
      else if (currentStatus === 'SUBMITTED_APPR3') auditAction = 'ASSESSMENT_APPROVE_APPR3';
      else if (currentStatus === 'SUBMITTED_MGR') auditAction = 'ASSESSMENT_APPROVE_MGR';
      else if (currentStatus === 'SUBMITTED_HR') auditAction = 'ASSESSMENT_REVIEW_HR';
      else if (currentStatus === 'SUBMITTED_MD') auditAction = 'ASSESSMENT_REVIEW_MD';
      else if (currentStatus === 'FEEDBACK_REQUIRED') auditAction = 'ASSESSMENT_FEEDBACK';
      else if (currentStatus === 'SUBMITTED_GM') auditAction = 'ASSESSMENT_CONFIRM_GM';

      await logAudit(
        auditAction,
        'Assessment',
        assessmentId,
        {
          previousStatus: currentStatus,
          newStatus: nextStatus,
          action: 'Approve/Confirm'
        }
      );

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
