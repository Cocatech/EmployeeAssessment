
import { saveResponses } from './src/actions/responses';
import { approveAssessment, getAssessment } from './src/actions/assessments';
import { prisma } from './src/lib/db';

async function testBackend() {
    const assessmentId = 'cmj6n4qj20004acy3ji084y6m'; // Target assessment
    console.log(`Testing backend for assessment: ${assessmentId}`);

    // 1. Fetch Assessment & Questions to mock data
    const assessment = await getAssessment(assessmentId);
    if (!assessment.success || !assessment.data) {
        console.error('Failed to fetch assessment');
        return;
    }

    console.log('Current Status:', assessment.data.status);
    console.log('Current Stage:', assessment.data.currentStage);

    // 2. Mock Responses for Approver 1 (EMP003)
    const questions = assessment.data.responses.map(r => ({
        questionId: r.questionId,
        questionTitle: r.questionTitle || 'Test Question',
        questionWeight: r.questionWeight || 10,
        scoreAppr1: 4, // Give 4 to everything
        commentAppr1: 'Test comment from backend script',
    }));

    if (questions.length === 0) {
        console.error('No questions/responses found to update');
        return;
    }

    console.log(`Saving ${questions.length} responses...`);
    const saveRes = await saveResponses(assessmentId, questions);

    if (!saveRes.success) {
        console.error('Save failed:', saveRes.error);
        return;
    }
    console.log('Save successful');

    // 3. Approve as Approver 1
    console.log('Approving as approver1...');
    const approveRes = await approveAssessment(assessmentId, 'approver1', 'Backend Test Approved');

    if (!approveRes.success) {
        console.error('Approval failed:', approveRes.error);
        return;
    }
    console.log('Approval successful');

    // 4. Verify Final State
    const finalState = await getAssessment(assessmentId);
    console.log('Final Status:', finalState.data?.status);
    console.log('Final Approver1 Status:', finalState.data?.approver1Status); // If available
}

testBackend()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
