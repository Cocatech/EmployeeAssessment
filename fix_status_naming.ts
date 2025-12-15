
import { prisma } from './src/lib/db';

async function fixStatusNaming() {
    console.log('=== FIXING STATUS NAMING TO SUBMITTED_* PATTERN ===\n');

    // Map old status names to new standardized names
    const statusMapping: Record<string, string> = {
        'PendingApprover1': 'SUBMITTED_APPR1',
        'PendingApprover2': 'SUBMITTED_APPR2',
        'PendingApprover3': 'SUBMITTED_APPR3',
        'PendingManager': 'SUBMITTED_MGR',
        'PendingHR': 'SUBMITTED_HR',
        'PendingMD': 'SUBMITTED_MD',
        'PendingGM': 'SUBMITTED_GM',
        'FeedbackRequired': 'FEEDBACK_REQUIRED',
        'SubmittedGM': 'SUBMITTED_GM',
        'Completed': 'COMPLETED',
    };

    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
        const result = await prisma.assessment.updateMany({
            where: { status: oldStatus },
            data: { status: newStatus }
        });

        if (result.count > 0) {
            console.log(`Updated ${result.count} assessments: "${oldStatus}" → "${newStatus}"`);
        }
    }

    // Verify results
    console.log('\n=== CURRENT STATUS DISTRIBUTION ===');
    const assessments = await prisma.assessment.findMany({
        select: { status: true }
    });

    const statusCounts: Record<string, number> = {};
    assessments.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    for (const [status, count] of Object.entries(statusCounts).sort()) {
        console.log(`  ${status}: ${count}`);
    }

    console.log('\n✓ Status naming standardization complete!');
}

fixStatusNaming()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
