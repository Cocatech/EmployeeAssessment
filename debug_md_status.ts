import { prisma } from './src/lib/db';

async function debugSubmittedMD() {
    const assessments = await prisma.assessment.findMany({
        where: { status: 'SUBMITTED_MD' },
        select: {
            id: true,
            status: true,
            employeeId: true,
            hrStatus: true,
            hrDate: true,
            mdStatus: true,
            mdDate: true,
        }
    });

    console.log('=== SUBMITTED_MD ASSESSMENTS ===');
    console.log(`Found ${assessments.length} assessments`);

    assessments.forEach(a => {
        console.log(`\n--- Assessment: ${a.id} (Employee: ${a.employeeId}) ---`);
        console.log(`Status: "${a.status}"`);
        console.log(`HR Status: "${a.hrStatus}"`);
        console.log(`HR Date: ${a.hrDate}`);
    });
}

debugSubmittedMD()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
