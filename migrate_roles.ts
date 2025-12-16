import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration: ADMIN -> HR');

    // Count existing ADMINs
    const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
    });

    console.log(`Found ${adminCount} users with role 'ADMIN'.`);

    if (adminCount > 0) {
        const result = await prisma.user.updateMany({
            where: { role: 'ADMIN' },
            data: { role: 'HR' }
        });
        console.log(`Successfully updated ${result.count} users to 'HR'.`);
    } else {
        console.log('No users to update.');
    }

    // Verification
    const hrCount = await prisma.user.count({
        where: { role: 'HR' }
    });
    console.log(`Verification: Total users with role 'HR': ${hrCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
