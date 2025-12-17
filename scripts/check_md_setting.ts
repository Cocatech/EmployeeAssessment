
import { prisma } from '@/lib/db';

async function main() {
    const setting = await prisma.systemSetting.findUnique({
        where: { key: 'md_code' },
    });

    if (setting) {
        console.log(`Current MD Code: ${setting.value}`);
        // As a bonus, let's look up who this is
        const employee = await prisma.employee.findUnique({
            where: { empCode: setting.value }
        });
        if (employee) {
            console.log(`Employee Name: ${employee.empName_Eng}`);
            console.log(`Position: ${employee.position}`);
        } else {
            console.log('Employee not found with this code.');
        }
    } else {
        console.log('No md_code setting found in SystemSetting.');
    }
}

main();
