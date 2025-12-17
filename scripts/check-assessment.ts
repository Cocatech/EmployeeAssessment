
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'cmj9s4qlw0006bqrmlnsws7lu';
    console.log(`Checking for Assessment ID: ${id}`);

    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id },
            include: {
                employee: true,
                assessor: true,
                responses: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        if (assessment) {
            console.log('Assessment FOUND:');
            console.log(`- Title: ${assessment.title}`);
            console.log(`- Status: ${assessment.status}`);
            console.log(`- CurrentStage: ${assessment.currentStage}`);
            console.log(`- Employee: ${assessment.employee?.empCode} (${assessment.employee?.empName_Eng})`);
        } else {
            console.log('Assessment NOT FOUND in database.');
        }
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
