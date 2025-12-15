import { prisma } from './src/lib/db';

async function checkResponses() {
    const assessment = await prisma.assessment.findFirst({
        where: { status: 'SUBMITTED_APPR1' },
        include: {
            responses: {
                select: {
                    questionId: true,
                    scoreSelf: true,
                    scoreAppr1: true,
                    scoreAppr2: true
                }
            }
        }
    });

    if (!assessment) {
        console.log('No assessment with SUBMITTED_APPR1');
        return;
    }

    console.log('=== ASSESSMENT ===');
    console.log(`ID: ${assessment.id}`);
    console.log(`Employee: ${assessment.employeeId}`);
    console.log(`Status: ${assessment.status}`);
    console.log(`\n=== RESPONSES (${assessment.responses.length}) ===`);

    assessment.responses.forEach((r, i) => {
        console.log(`${i + 1}. Self=${r.scoreSelf ?? 'null'}, Appr1=${r.scoreAppr1 ?? 'null'}, Appr2=${r.scoreAppr2 ?? 'null'}`);
    });

    // Check total questions
    const questionCount = await prisma.assessmentQuestion.count({ where: { isActive: true } });
    console.log(`\nTotal active questions: ${questionCount}`);
}

checkResponses()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
