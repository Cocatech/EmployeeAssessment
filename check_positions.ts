import { prisma } from './src/lib/db';

async function checkPositions() {
    // Check all employee positions
    const employees = await prisma.employee.findMany({
        select: { empCode: true, empName_Eng: true, position: true }
    });

    console.log('=== ALL EMPLOYEE POSITIONS ===');
    employees.forEach(e => {
        const isHR = e.position === 'HR';
        const isMD = e.position === 'MD';
        const role = isHR ? '[HR]' : isMD ? '[MD]' : '';
        console.log(`• ${e.empCode} | ${e.empName_Eng} | Position: "${e.position}" ${role}`);
    });

    // Find HR users
    const hrUsers = employees.filter(e => e.position === 'HR');
    console.log('\n=== HR USERS (position = "HR") ===');
    if (hrUsers.length === 0) {
        console.log('No users with position = "HR"');
    } else {
        hrUsers.forEach(e => console.log(`• ${e.empCode} | ${e.empName_Eng}`));
    }

    // Find MD users by position
    const mdUsers = employees.filter(e => e.position === 'MD');
    console.log('\n=== MD USERS (position = "MD") ===');
    if (mdUsers.length === 0) {
        console.log('No users with position = "MD"');
    } else {
        mdUsers.forEach(e => console.log(`• ${e.empCode} | ${e.empName_Eng}`));
    }
}

checkPositions()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
