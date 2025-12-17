
import { prisma } from '@/lib/db';

async function main() {
    try {
        console.log('Starting MD cleanup...');

        // 1. Clear System Setting
        await prisma.systemSetting.deleteMany({
            where: { key: 'md_code' }
        });
        console.log('✓ Cleared md_code from SystemSetting');

        // 2. Find and Delete MD Employees
        // Assuming 'MD' or 'Managing Director' are the position names
        const mds = await prisma.employee.findMany({
            where: {
                OR: [
                    { position: 'MD' },
                    { position: 'Managing Director' }
                ]
            }
        });

        console.log(`Found ${mds.length} MD employees to delete.`);

        for (const md of mds) {
            // Optional: Check if they are part of any active assessment? 
            // For now, we force delete as requested.
            // We might need to handle foreign key constraints if they are used as Approvers in other tables.
            // Prisma usually complains if we don't handle relations.
            // Let's try to delete. If they are referenced, we might need to nullify references first.

            // Nullify references in Assessment (mdStatus, currentStage if they are current)
            // This is complex. If it fails, I'll know.

            console.log(`Deleting ${md.empCode} (${md.empName_Eng})...`);
            try {
                await prisma.employee.delete({
                    where: { empCode: md.empCode }
                });
                console.log(`✓ Deleted ${md.empCode}`);
            } catch (e) {
                console.error(`X Failed to delete ${md.empCode}:`, e);
                console.log('  (They might be referenced in existing assessments. Deleting specific test user usually works if no active assessments)');
            }
        }

        console.log('MD Cleanup Complete.');

    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

main();
