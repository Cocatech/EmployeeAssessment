
import { prisma } from './src/lib/db';

async function simulateDashboardFilter() {
    const currentUserId = 'EMP001'; // The approver trying to see assessments

    console.log('=== SIMULATING DASHBOARD FILTER FOR EMP001 ===\n');

    // Get all employees
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        select: {
            empCode: true,
            empName_Eng: true,
            approver1_ID: true,
            approver2_ID: true,
            approver3_ID: true,
            manager_ID: true,
            gm_ID: true,
        }
    });

    // Get all assessments
    const assessments = await prisma.assessment.findMany({
        include: { employee: true }
    });

    console.log(`Total assessments: ${assessments.length}`);
    console.log(`Checking which EMP001 should see...\n`);

    let visibleCount = 0;

    for (const assessment of assessments) {
        const employee = employees.find(e => e.empCode === assessment.employeeId);
        const statusUpper = assessment.status.toUpperCase();

        const isOwn = assessment.employeeId === currentUserId;

        let isApprover = false;
        if (employee && statusUpper !== 'DRAFT') {
            isApprover =
                employee.approver1_ID === currentUserId ||
                employee.approver2_ID === currentUserId ||
                employee.approver3_ID === currentUserId ||
                employee.gm_ID === currentUserId;
        }

        const shouldSee = isOwn || isApprover;

        if (shouldSee) {
            visibleCount++;
            console.log(`✓ VISIBLE: ${assessment.id}`);
            console.log(`  Employee: ${assessment.employeeId}`);
            console.log(`  Status: ${assessment.status}`);
            console.log(`  Own?: ${isOwn}, Approver?: ${isApprover}`);
            if (employee) {
                console.log(`  Employee Approver2_ID: "${employee.approver2_ID}"`);
            }
            console.log('');
        }
    }

    console.log(`\n=== RESULT: EMP001 should see ${visibleCount} assessments ===`);
}

simulateDashboardFilter()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
