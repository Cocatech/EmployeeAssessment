
import { prisma } from '@/lib/db';

async function main() {
    console.log('--- Verifying MD Status ---');

    // 1. Find employees with "MD" in their position
    const potentialMDs = await prisma.employee.findMany({
        where: {
            OR: [
                { position: { contains: 'MD', mode: 'insensitive' } },
                { position: { contains: 'Managing Director', mode: 'insensitive' } }
            ]
        },
        include: { user: true }
    });

    const allMDs = potentialMDs;

    if (allMDs.length === 0) {
        console.log('X No employee found with position "MD" or "Managing Director".');
    } else {
        console.log(`✓ Found ${allMDs.length} potential MD employee(s):`);
        allMDs.forEach(e => {
            const userStatus = e.user ? `Linked User: ${e.user.email} (Active: ${e.user.isActive})` : 'No Linked User';
            console.log(`   - ${e.empName_Eng} (${e.empCode}), Position: ${e.position}`);
            console.log(`     -> ${userStatus}`);
        });
    }

    // 2. Check System Setting
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'md_code' },
    });

    if (setting) {
        console.log(`✓ System Setting 'md_code' is set to: ${setting.value}`);
        const match = allMDs.find(e => e.empCode === setting.value);
        if (match) {
            console.log(`   -> Matches found employee: ${match.empName_Eng}`);
        } else {
            console.log(`   -> WARNING: Does NOT match any found MD employee.`);
        }
    } else {
        console.log('X System Setting "md_code" is NOT set.');
        if (allMDs.length > 0) {
            console.log(`   -> There is an MD user, but the system doesn't know to use them for routing yet.`);
            console.log(`   -> We need to update 'md_code' to: ${allMDs[0].empCode}`);
        }
    }
}

main();
