
import { prisma } from './src/lib/db';
import * as bcrypt from 'bcryptjs';

async function seedMD() {
    console.log('--- Seeding MD ---');

    const mdCode = 'EMPMD';
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Create or Update MD Employee
    const md = await prisma.employee.upsert({
        where: { empCode: mdCode },
        update: {},
        create: {
            empCode: mdCode,
            empName_Eng: 'Managing Director',
            empName_Thai: 'กรรมการผู้จัดการ',
            position: 'Managing Director',
            assessmentLevel: 'L6-Management',
            employeeType: 'Permanent',
            joinDate: new Date(),
            group: 'Management',
            // MD usually has no approvers in this workflow context for their own assessment,
            // but plays a role in others'.
            user: {
                create: {
                    email: 'md@example.com',
                    name: 'Managing Director',
                    passwordHash: hashedPassword,
                    role: 'It should be Manager or similar, let use MANAGER',
                    userType: 'EMPLOYEE'
                }
            }
        }
    });
    console.log(`Created/Updated MD: ${md.empCode}`);

    // 2. Update System Setting
    await prisma.systemSetting.upsert({
        where: { key: 'md_code' },
        update: { value: mdCode },
        create: {
            key: 'md_code',
            value: mdCode,
            label: 'Managing Director Employee Code',
            type: 'text'
        }
    });
    console.log('Updated md_code system setting.');

    // 3. Create HR User just in case (EMPHR)
    const hrCode = 'EMPHR';
    const hr = await prisma.employee.upsert({
        where: { empCode: hrCode },
        update: {},
        create: {
            empCode: hrCode,
            empName_Eng: 'HR Manager',
            position: 'HR Manager',
            assessmentLevel: 'L4-Supervise',
            employeeType: 'Permanent',
            joinDate: new Date(),
            group: 'HR',
            user: {
                create: {
                    email: 'hr@example.com',
                    name: 'HR Manager',
                    passwordHash: hashedPassword,
                    role: 'ADMIN', // HR needs Admin to see all
                    userType: 'EMPLOYEE'
                }
            }
        }
    });
    console.log(`Created/Updated HR: ${hr.empCode}`);

}

seedMD()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
