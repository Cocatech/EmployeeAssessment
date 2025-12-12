import { getQuestions, getQuestionStats } from "@/actions/questions"
import { getAssessmentLevels } from "@/actions/levels"
import QuestionManagement from "@/components/settings/questions/QuestionManagement"
import { LevelManager } from "@/components/settings/levels/LevelManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function AssessmentQuestionsPage() {
    const questions = await getQuestions()
    const stats = await getQuestionStats()
    const levels = await getAssessmentLevels()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assessment Configuration</h2>
                    <p className="text-muted-foreground">
                        Manage assessment criteria, templates, and level definitions.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="questions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="questions">Question Templates</TabsTrigger>
                    <TabsTrigger value="levels">Assessment Levels</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-4">
                    <QuestionManagement
                        initialQuestions={questions}
                        stats={stats.success ? stats.data : undefined}
                        levels={levels}
                    />
                </TabsContent>

                <TabsContent value="levels" className="space-y-4">
                    <LevelManager initialLevels={levels} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
