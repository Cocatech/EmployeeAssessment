import { NextRequest, NextResponse } from 'next/server';
import { updateAssessment } from '@/actions/assessments';
import { getAssessments } from '@/actions/assessments';
// Legacy route - use new workflow actions instead
// import { calculateAssessmentScore } from '@/actions/responses';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, action, nextStatus } = body;

    if (!assessmentId || !action) {
      return NextResponse.json(
        { error: 'Assessment ID and action are required' },
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

    if (action === 'reject') {
      // Reject assessment
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
      // Legacy route - Use new workflow actions instead
      // TODO: Migrate to use approveAssessment from @/actions/assessments
      
      const updateData: any = {
        status: nextStatus || 'Completed',
        approvedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const updated = await updateAssessment(assessmentId, updateData);

      return NextResponse.json({ 
        success: true, 
        message: 'Assessment approved (legacy)',
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
