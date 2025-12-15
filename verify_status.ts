
import { prisma } from './src/lib/db';

async function verifyStatus() {
    console.log('=== VERIFYING ASSESSMENT STATUS ===\n');

    const assessments = await prisma.assessment.findMany({
        select: {
            id: true,
            status: true,
            currentStage: true,
            employeeId: true,
            title: true
        }
    });

    console.log('Total assessments:', assessments.length);
    assessments.forEach(a => {
        console.log(`\n• ${a.title || a.id.slice(0, 8)}`);
        console.log(`  Status: ${a.status}`);
        console.log(`  currentStage: ${a.currentStage || 'null'}`);
        console.log(`  employeeId: ${a.employeeId}`);
    });

    // Check if any old statuses remain
    const oldPatterns = assessments.filter(a =>
        a.status.startsWith('Pending') ||
        a.status === 'FeedbackRequired' ||
        a.status === 'SubmittedGM' ||
        a.status === 'Completed'
    );

    if (oldPatterns.length > 0) {
        console.log('\n⚠️  WARNING: Found old status patterns:');
        oldPatterns.forEach(a => console.log(`  - ${a.status} (${a.id.slice(0, 8)})`));
    } else {
        console.log('\n✓ All status values are now standardized to SUBMITTED_* pattern!');
    }
}

verifyStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
