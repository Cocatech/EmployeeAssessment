
import { prisma } from '@/lib/db';

// CONFIGURATION
const MD_CODE = 'MD_001'; // <--- Change this if needed
const MD_NAME = 'Polly MD'; // <--- Change this
const MD_EMAIL = 'polly.md@example.com';

async function main() {
    try {
        console.log(`Creating new MD: ${MD_NAME} (${MD_CODE})...`);

        // 1. Create or Update Employee
        const employee = await prisma.employee.upsert({
            where: { empCode: MD_CODE },
            update: {
                empName_Eng: MD_NAME,
                position: 'MD', // Crucial for role checks
                email: MD_EMAIL,
                isActive: true,
                // MD usually has no manager?
            },
            create: {
                empCode: MD_CODE,
                empName_Eng: MD_NAME,
                position: 'MD',
                email: MD_EMAIL,
                assessmentLevel: 'L3', // Executive level
                joinDate: new Date(),
                isActive: true,
                group: 'Management',
                employeeType: 'Permanent',
            }
        });
        console.log('✓ Employee Created/Updated');

        // 2. Set System Setting
        // This tells the assessment system "This user is the MD for approval flow"
        await prisma.systemSetting.upsert({
            where: { key: 'md_code' },
            update: { value: MD_CODE },
            create: {
                key: 'md_code',
                value: MD_CODE,
                label: 'Employee Code for Managing Director',
                type: 'text'
            }
        });
        console.log('✓ SystemSetting md_code Updated');

        console.log('Done! New MD is ready.');

    } catch (error) {
        console.error('Error creating MD:', error);
    }
}

main();
