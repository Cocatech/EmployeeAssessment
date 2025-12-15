import { prisma } from './src/lib/db';

async function checkCurrentStatus() {
    const assessment = await prisma.assessment.findFirst({
        where: { employeeId: 'EMP005' },
        select: {
            id: true,
            status: true,
            currentStage: true,
            mdStatus: true,
            mdDate: true,
            mdNote: true,
            feedbackDate: true
        }
    });

    console.log('=== ASSESSMENT STATUS ===');
    console.log(assessment);
}

checkCurrentStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
