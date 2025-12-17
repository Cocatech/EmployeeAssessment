
import { prisma } from '@/lib/db';
import { createAssessmentDraft } from '@/actions/assessments';

console.log('Imports successful');

async function main() {
    try {
        const count = await prisma.employee.count();
        console.log('Employee count:', count);
    } catch (e) {
        console.error('DB Error:', e);
    }
}
main();
