import { prisma } from './src/lib/db';

async function getLogins() {
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
            user: { select: { email: true, role: true } }
        }
    });

    console.log('=== AVAILABLE LOGINS ===\n');
    employees.forEach(e => {
        console.log(`• ${e.empCode}: ${e.empName_Eng}`);
        console.log(`  Email: ${e.user?.email || 'N/A'}`);
        console.log(`  Role: ${e.user?.role || 'EMPLOYEE'}`);
        if (e.approver1_ID) console.log(`  Appr1: ${e.approver1_ID}`);
        if (e.approver2_ID) console.log(`  Appr2: ${e.approver2_ID}`);
        console.log('');
    });
}

getLogins().finally(() => prisma.$disconnect());
