
import { prisma } from './src/lib/db';
import { updateAssessment } from './src/actions/assessments';

async function verifyWorkflow() {
    console.log('Starting Verification...');

    // 1. Setup: Create or Find a test assessment
    // specific ID or create new. Let's pick one.
    // We need an employee with Manager, HR, MD, GM chain.
    // Let's assume we use EMP001 (has full chain usually).

    const empCode = 'EMP001';
    const employee = await prisma.employee.findUnique({ where: { empCode } });

    if (!employee) {
        console.error('Test employee not found');
        return;
    }

    // Create a dummy assessment for testing
    const assessment = await prisma.assessment.create({
        data: {
            title: 'Workflow Test',
            assessmentType: 'KPI',
            status: 'SUBMITTED_MD', // Start from MD to test the tail
            employeeId: empCode,
            periodStart: new Date(),
            periodEnd: new Date(),
            dueDate: new Date(),
        }
    });

    console.log(`Created test assessment: ${assessment.id} with status ${assessment.status}`);

    // 2. Test MD Approval -> FEEDBACK_REQUIRED
    console.log('Testing MD Approval...');
    // Simulate API call logic (approve)
    // We can't call API route directly, so we used logic from route:
    // determineNextStatus('SUBMITTED_MD') -> 'FEEDBACK_REQUIRED'

    // Let's call the API handler logic simulation
    await updateAssessment(assessment.id, {
        status: 'FEEDBACK_REQUIRED',
        mdDate: new Date(),
        mdNote: 'MD Approved',
    });

    let updated = await prisma.assessment.findUnique({ where: { id: assessment.id } });
    console.log(`After MD Approval: ${updated?.status} (Expected: FEEDBACK_REQUIRED)`);

    // 3. Test Feedback Confirmation -> SUBMITTED_GM
    console.log('Testing Feedback Confirmation...');
    await updateAssessment(assessment.id, {
        status: 'SUBMITTED_GM',
        feedbackDate: new Date(),
    });

    updated = await prisma.assessment.findUnique({ where: { id: assessment.id } });
    console.log(`After Feedback: ${updated?.status} (Expected: SUBMITTED_GM)`);
    console.log(`Feedback Date: ${updated?.feedbackDate}`);

    // 4. Test GM Confirmation -> COMPLETED
    console.log('Testing GM Confirmation...');
    await updateAssessment(assessment.id, {
        status: 'COMPLETED',
        gmDate: new Date(),
        gmStatus: 'APPROVED',
        gmNote: 'GM Approved',
        completedAt: new Date(),
    });

    updated = await prisma.assessment.findUnique({ where: { id: assessment.id } });
    console.log(`After GM: ${updated?.status} (Expected: COMPLETED)`);
    console.log(`GM Date: ${updated?.gmDate}`);

    // Cleanup
    console.log('Cleaning up...');
    await prisma.assessment.delete({ where: { id: assessment.id } });
    console.log('Done.');
}

verifyWorkflow()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
