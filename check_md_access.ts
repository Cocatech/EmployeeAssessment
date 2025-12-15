import { prisma } from './src/lib/db';

async function checkMDAccess() {
    // 1. Check assessment status
    const assessment = await prisma.assessment.findFirst({
        where: { employeeId: 'EMP005' },
        select: { id: true, status: true, currentStage: true }
    });

    console.log('=== ASSESSMENT STATUS ===');
    console.log(assessment);

    // 2. Check MD config in system settings
    const mdSetting = await prisma.systemSetting.findUnique({
        where: { key: 'md_code' }
    });

    console.log('\n=== MD CONFIG (System Setting) ===');
    console.log(mdSetting ? `md_code = "${mdSetting.value}"` : 'md_code not set!');

    // 3. Check if EMPMD user exists
    const mdUser = await prisma.user.findUnique({
        where: { empCode: 'EMPMD' },
        select: { empCode: true, name: true, email: true, role: true }
    });

    console.log('\n=== EMPMD USER ===');
    console.log(mdUser || 'EMPMD user not found!');

    // 4. Check match
    if (mdSetting && mdUser) {
        const matches = mdSetting.value === 'EMPMD';
        console.log(`\n=== MATCH CHECK ===`);
        console.log(`md_code setting = "${mdSetting.value}"`);
        console.log(`Looking for = "EMPMD"`);
        console.log(`Match: ${matches ? '✓ YES' : '✗ NO - NEED TO FIX!'}`);
    }
}

checkMDAccess()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
