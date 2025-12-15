import { prisma } from './src/lib/db';

async function checkManagerVisibility() {
    // 1. Check assessment status
    const assessment = await prisma.assessment.findFirst({
        where: { employeeId: 'EMP005' },
        select: { id: true, status: true, currentStage: true, employeeId: true }
    });

    console.log('=== ASSESSMENT STATUS ===');
    console.log(assessment);

    // 2. Check employee's manager
    const employee = await prisma.employee.findUnique({
        where: { empCode: 'EMP005' },
        select: {
            empCode: true,
            empName_Eng: true,
            manager_ID: true,
            approver1_ID: true,
            approver2_ID: true,
            approver3_ID: true
        }
    });

    console.log('\n=== EMP005 APPROVAL CHAIN ===');
    console.log(employee);

    // 3. Check if EMP999 exists and is the manager
    const manager = await prisma.employee.findUnique({
        where: { empCode: 'EMP999' },
        select: { empCode: true, empName_Eng: true, role: true }
    });

    console.log('\n=== EMP999 (Expected Manager) ===');
    console.log(manager);

    // 4. Check if manager_ID matches
    if (employee && manager) {
        const matches = employee.manager_ID === 'EMP999';
        console.log(`\n=== MATCH CHECK ===`);
        console.log(`EMP005.manager_ID = "${employee.manager_ID}"`);
        console.log(`Looking for = "EMP999"`);
        console.log(`Match: ${matches ? '✓ YES' : '✗ NO'}`);
    }
}

checkManagerVisibility()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
