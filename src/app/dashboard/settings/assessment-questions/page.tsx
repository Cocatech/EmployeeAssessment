import { getQuestions, getQuestionStats } from "@/actions/questions"
import { getAssessmentLevels } from "@/actions/levels"
import { getAssessmentCategories } from "@/actions/categories" // Added import
import { QuestionManagement } from "@/components/settings/questions/QuestionManagement"
import { LevelManager } from "@/components/settings/levels/LevelManager"
import { CategoryManager } from "@/components/settings/categories/CategoryManager" // Added import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function AssessmentQuestionsPage() {
    const questions = await getQuestions()
    const statsResult = await getQuestionStats()
    const stats = statsResult.success ? statsResult.data : undefined
    const levels = await getAssessmentLevels()
    const serializedLevels = levels.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString()
    }))

    const categories = await getAssessmentCategories()
    const serializedCategories = categories.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
    }))

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
                <TabsList className="grid w-full grid-cols-3"> {/* Modified TabsList */}
                    <TabsTrigger value="questions">Question Templates</TabsTrigger>
                    <TabsTrigger value="levels">Assessment Levels</TabsTrigger>
                    <TabsTrigger value="categories">Assessment Categories</TabsTrigger> {/* Added Trigger */}
                </TabsList>

                <TabsContent value="questions" className="space-y-4">
                    <QuestionManagement
                        initialQuestions={questions}
                        initialStats={stats}
                        levels={serializedLevels}
                        categories={serializedCategories}
                    />
                </TabsContent>

                <TabsContent value="levels" className="space-y-4">
                    <LevelManager initialLevels={serializedLevels} />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4"> {/* Added Content */}
                    <CategoryManager initialCategories={serializedCategories} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
