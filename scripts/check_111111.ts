
import { prisma } from '@/lib/db';

async function main() {
    const code = '111111';
    console.log(`Checking for employee with code: '${code}'`);

    const emp = await prisma.employee.findUnique({
        where: { empCode: code }
    });

    if (emp) {
        console.log('Found:', emp.empCode, emp.empName_Eng);
    } else {
        console.log('Not Found');
    }
}

main();
