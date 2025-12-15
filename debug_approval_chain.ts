
import { prisma } from './src/lib/db';

async function debugApprovalChain() {
    console.log('=== APPROVAL CHAIN DEBUG ===\n');

    // 1. Get all assessments for EMP005
    const assessments = await prisma.assessment.findMany({
        where: { employeeId: 'EMP005' },
        include: { employee: true },
        orderBy: { updatedAt: 'desc' },
    });

    console.log(`Found ${assessments.length} assessments for EMP005\n`);

    for (const a of assessments) {
        console.log('--- Assessment ---');
        console.log(`ID: ${a.id}`);
        console.log(`Status: "${a.status}"`);
        console.log(`currentStage: "${a.currentStage}"`);
        console.log(`approver1Status: "${a.approver1Status}"`);
        console.log(`approver2Status: "${a.approver2Status}"`);
        console.log(`approver3Status: "${a.approver3Status}"`);
        console.log(`mdStatus: "${a.mdStatus}"`);
        console.log('');

        console.log('Employee Approval Chain:');
        console.log(`  Approver1: ${a.employee?.approver1_ID}`);
        console.log(`  Approver2: ${a.employee?.approver2_ID}`);
        console.log(`  Approver3: ${a.employee?.approver3_ID}`);
        console.log(`  Manager: ${a.employee?.manager_ID}`);
        console.log(`  GM: ${a.employee?.gm_ID}`);
        console.log('');
    }

    // 2. Check what assessments EMP001 should see
    console.log('=== ASSESSMENTS VISIBLE TO EMP001 (Approver 2) ===\n');

    const visibleToEmp001 = await prisma.assessment.findMany({
        where: {
            employee: {
                approver2_ID: 'EMP001'
            },
            status: {
                in: ['PendingApprover2', 'SUBMITTED_APPR2']
            }
        },
        include: { employee: true }
    });

    console.log(`Assessments pending for EMP001 as Approver2: ${visibleToEmp001.length} `);
    for (const a of visibleToEmp001) {
        console.log(`  - ${a.id} (Employee: ${a.employeeId}, Status: ${a.status})`);
    }
    console.log('');

    // 3. Check what the approveAssessment function should set
    console.log('=== EXPECTED STATUS TRANSITIONS ===');
    console.log('After Approver1 approves:');
    console.log('  For employee with Approver2: Status should be "PendingApprover2" or "SUBMITTED_APPR2"');
    console.log('  currentStage should be set to Approver2 ID');
    console.log('');
}

debugApprovalChain()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
