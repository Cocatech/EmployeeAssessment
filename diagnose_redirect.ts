
import { prisma } from './src/lib/db';

async function diagnoseRedirect() {
    // Check assessment cmj6r0l8o0004lxmctc65om7p
    const assessmentId = 'cmj6r0l8o0004lxmctc65om7p';
    const currentUserId = 'EMP003'; // Approver 1 trying to access

    console.log('=== DIAGNOSTIC: Redirect Loop Analysis ===');
    console.log(`Assessment ID: ${assessmentId}`);
    console.log(`Current User: ${currentUserId}`);
    console.log('');

    // 1. Get Assessment
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { employee: true },
    });

    if (!assessment) {
        console.log('ERROR: Assessment not found!');
        return;
    }

    console.log('--- Assessment Data ---');
    console.log(`Status: "${assessment.status}"`);
    console.log(`currentStage: "${assessment.currentStage}"`);
    console.log(`Employee ID: ${assessment.employeeId}`);
    console.log('');

    // 2. Check validStatuses
    const validStatuses = [
        'PendingApprover1', 'PendingApprover2', 'PendingApprover3',
        'PendingManager', 'PendingMD', 'PendingGM', 'SubmittedGM',
        'FeedbackRequired'
    ];

    console.log('--- Status Check ---');
    console.log(`Is status in validStatuses? ${validStatuses.includes(assessment.status)}`);
    if (!validStatuses.includes(assessment.status)) {
        console.log(`>>> REDIRECT CAUSE #1: Status "${assessment.status}" is NOT in validStatuses!`);
        console.log(`>>> Valid statuses are: ${validStatuses.join(', ')}`);
    }
    console.log('');

    // 3. Check Authorization
    const employee = assessment.employee;
    if (!employee) {
        console.log('ERROR: Employee data not found!');
        return;
    }

    console.log('--- Employee Approver Chain ---');
    console.log(`Approver 1 ID: "${employee.approver1_ID}"`);
    console.log(`Approver 2 ID: "${employee.approver2_ID}"`);
    console.log(`Approver 3 ID: "${employee.approver3_ID}"`);
    console.log(`Manager ID: "${employee.manager_ID}"`);
    console.log(`GM ID: "${employee.gm_ID}"`);
    console.log('');

    let isAuthorized = false;
    let expectedRole = '';

    if (assessment.status === 'PendingApprover1') {
        isAuthorized = employee.approver1_ID === currentUserId;
        expectedRole = `approver1 (must match Approver1_ID: "${employee.approver1_ID}")`;
    } else if (assessment.status === 'PendingApprover2') {
        isAuthorized = employee.approver2_ID === currentUserId;
        expectedRole = `approver2 (must match Approver2_ID: "${employee.approver2_ID}")`;
    } else if (assessment.status === 'PendingApprover3') {
        isAuthorized = employee.approver3_ID === currentUserId;
        expectedRole = `approver3 (must match Approver3_ID: "${employee.approver3_ID}")`;
    } else if (assessment.status === 'PendingManager' || assessment.status === 'FeedbackRequired') {
        isAuthorized = employee.manager_ID === currentUserId;
        expectedRole = `manager (must match Manager_ID: "${employee.manager_ID}")`;
    } else if (assessment.status === 'PendingGM' || assessment.status === 'SubmittedGM') {
        isAuthorized = employee.gm_ID === currentUserId;
        expectedRole = `gm (must match GM_ID: "${employee.gm_ID}")`;
    }

    console.log('--- Authorization Check ---');
    console.log(`Current User: "${currentUserId}"`);
    console.log(`Expected Role: ${expectedRole}`);
    console.log(`Is Authorized: ${isAuthorized}`);

    if (!isAuthorized && validStatuses.includes(assessment.status)) {
        console.log(`>>> REDIRECT CAUSE #2: User "${currentUserId}" is NOT authorized for status "${assessment.status}"!`);
    }

    console.log('');
    console.log('=== SOLUTION ===');
    if (!validStatuses.includes(assessment.status)) {
        console.log(`Assessment status needs to be one of: ${validStatuses.join(', ')}`);
        console.log(`Current status "${assessment.status}" doesn't allow approval.`);
    } else if (!isAuthorized) {
        console.log(`User "${currentUserId}" is not the correct approver for this stage.`);
        console.log(`The system expects: ${expectedRole}`);
    } else {
        console.log('No obvious issue found. Page should allow access.');
    }
}

diagnoseRedirect()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
