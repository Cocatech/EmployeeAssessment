import { prisma } from './src/lib/db';

async function checkAllAssessments() {
    const assessments = await prisma.assessment.findMany({
        select: {
            id: true,
            status: true,
            employeeId: true,
            hrStatus: true,
            hrDate: true,
            mdStatus: true,
            mdDate: true,
            feedbackDate: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
    });

    console.log('=== RECENT 5 ASSESSMENTS ===');

    assessments.forEach(a => {
        console.log(`\n--- Assessment: ${a.id} (Employee: ${a.employeeId}) ---`);
        console.log(`Status: "${a.status}"`);
        console.log(`HR: status="${a.hrStatus}" date=${a.hrDate ? 'SET' : 'NULL'}`);
        console.log(`MD: status="${a.mdStatus}" date=${a.mdDate ? 'SET' : 'NULL'}`);
        console.log(`Feedback: date=${a.feedbackDate ? 'SET' : 'NULL'}`);
    });
}

checkAllAssessments()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
