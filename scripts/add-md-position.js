const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Adding MD position...');

    const md = await prisma.position.upsert({
        where: { code: 'MD' },
        update: {},
        create: {
            code: 'MD',
            name: 'Managing Director',
            description: 'Managing Director / Top Executive',
            sortOrder: 0,
            isActive: true,
        },
    });

    console.log('Created/Found Position:', md);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
