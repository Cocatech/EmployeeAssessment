import { prisma } from './src/lib/db';

async function checkHRUser() {
    // Find all users and their roles
    const users = await prisma.user.findMany({
        select: { empCode: true, email: true, name: true, role: true }
    });

    console.log('=== ALL USERS ===');
    users.forEach(u => {
        console.log(`• ${u.empCode || 'N/A'} | ${u.name} | ${u.email} | Role: ${u.role}`);
    });

    // Find users with HR-like roles
    console.log('\n=== USERS WITH ADMIN/HR ROLE ===');
    const hrUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'HR');
    if (hrUsers.length === 0) {
        console.log('No users with ADMIN or HR role found!');
        console.log('You need to set a user role to ADMIN for HR access.');
    } else {
        hrUsers.forEach(u => console.log(`• ${u.empCode} | ${u.name} | Role: ${u.role}`));
    }
}

checkHRUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
