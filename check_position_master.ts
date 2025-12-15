import { prisma } from './src/lib/db';

async function checkPositionMaster() {
    // Check Position master table
    const positions = await prisma.position.findMany({
        select: { code: true, name: true, isActive: true }
    });

    console.log('=== POSITION MASTER TABLE ===');
    positions.forEach(p => {
        console.log(`• Code: "${p.code}" | Name: "${p.name}" | Active: ${p.isActive}`);
    });

    // Find HR and MD codes
    const hrPosition = positions.find(p => p.code === 'HR');
    const mdPosition = positions.find(p => p.code === 'MD');

    console.log('\n=== SPECIAL POSITIONS ===');
    console.log(`HR: ${hrPosition ? `Code="${hrPosition.code}" Name="${hrPosition.name}"` : 'NOT FOUND'}`);
    console.log(`MD: ${mdPosition ? `Code="${mdPosition.code}" Name="${mdPosition.name}"` : 'NOT FOUND'}`);

    console.log('\n=== PROPOSED FIX ===');
    console.log('Option 1: Check if Employee.position = Position.name where Position.code = "HR"');
    console.log('Option 2: Change Employee.position to store Position.code instead of name');
    console.log('Option 3: Add positionCode field to Employee table');
}

checkPositionMaster()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
