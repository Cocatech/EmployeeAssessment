import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Clearing assessments and responses...')

    try {
        const deletedResponses = await prisma.assessmentResponse.deleteMany({})
        console.log(`Deleted ${deletedResponses.count} responses.`)

        const deletedAssessments = await prisma.assessment.deleteMany({})
        console.log(`Deleted ${deletedAssessments.count} assessments.`)

        console.log('✅ All assessments cleared successfully.')
    } catch (error) {
        console.error('Error clearing data:', error)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
