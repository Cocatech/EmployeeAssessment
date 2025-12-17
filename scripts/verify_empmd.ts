
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying EMPMD Position ---');

    const empCode = 'EMPMD';

    // 1. Fetch Employee
    const employee = await prisma.employee.findUnique({
        where: { empCode },
        select: { empCode: true, empName_Eng: true, position: true }
    });

    if (!employee) {
        console.error(`❌ Employee with code '${empCode}' NOT found.`);
        return;
    }

    console.log(`✅ Employee Found: ${employee.empName_Eng} (${employee.empCode})`);
    console.log(`   Position Name stored in Employee: "${employee.position}"`);

    // 2. Fetch Position by Name
    const position = await prisma.position.findFirst({
        where: { name: employee.position }
    });

    if (!position) {
        console.error(`❌ Position with name "${employee.position}" NOT found in Position table.`);
        console.log('   (This means the system cannot resolve the Position Code)');
        return;
    }

    console.log(`✅ Position Found in Table:`);
    console.log(`   Name: "${position.name}"`);
    console.log(`   Code: "${position.code}"`);
    console.log(`   ID:   "${position.id}"`);

    // 3. Verify Match
    if (position.code === 'MD') {
        console.log('\n✅ RESULT: CORRECT. The employee has position code "MD".');
    } else {
        console.log(`\n❌ RESULT: INCORRECT. The position code is "${position.code}", but expected "MD".`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
