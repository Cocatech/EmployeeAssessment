"use client"

import { useState, useMemo } from "react"
import { AssessmentQuestion } from "@/types/assessment"
import { AssessmentLevel, AssessmentCategory } from "@prisma/client"
import { QuestionListTable } from "./QuestionListTable"
import { QuestionFormDialog } from "./QuestionFormDialog"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Layers, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { deleteQuestions } from "@/actions/questions"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuestionStats {
    total: number
    active: number
    inactive: number
    byCategory: Record<string, number>
    byLevel: Record<string, number>
}

type SerializedAssessmentLevel = Omit<AssessmentLevel, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

type SerializedAssessmentCategory = Omit<AssessmentCategory, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

interface QuestionManagementProps {
    initialQuestions?: AssessmentQuestion[]
    initialStats?: QuestionStats
    levels: SerializedAssessmentLevel[]
    categories?: SerializedAssessmentCategory[]
}

export function QuestionManagement({ initialQuestions = [], initialStats, levels = [], categories = [] }: QuestionManagementProps) {
    const router = useRouter()
    const [view, setView] = useState<"overview" | "detail">("overview")
    const [selectedLevel, setSelectedLevel] = useState<string>("All")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<AssessmentQuestion | null>(null)

    // Clear All Dialog State
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    // Derived stats if not provided (fallback)
    const activeStats = useMemo(() => {
        if (initialStats) return initialStats.byLevel;
        const counts: Record<string, number> = {};
        initialQuestions.forEach(q => {
            counts[q.applicableLevel] = (counts[q.applicableLevel] || 0) + 1;
        });
        return counts;
    }, [initialQuestions, initialStats]);

    const filteredQuestions = useMemo(() => {
        return initialQuestions.filter(q => {
            const levelMatch = selectedLevel === "All" || q.applicableLevel === selectedLevel
            const categoryMatch = selectedCategory === "All" || q.category === selectedCategory
            return levelMatch && categoryMatch
        })
    }, [initialQuestions, selectedLevel, selectedCategory])

    const handleLevelClick = (levelCode: string) => {
        setSelectedLevel(levelCode);
        setView("detail");
    }

    const handleBackToOverview = () => {
        setView("overview");
        setSelectedLevel("All");
        setSelectedCategory("All");
    }

    const handleCreate = () => {
        setEditingQuestion(null)
        setIsDialogOpen(true)
        // Auto-select level is handled by passing defaultLevel to Dialog
    }

    const handleEdit = (q: AssessmentQuestion) => {
        setEditingQuestion(q)
        setIsDialogOpen(true)
    }

    const handleQuestionSaved = () => {
        router.refresh()
    }

    const handleClearAllClick = () => {
        setDeleteConfirmText("")
        setIsClearDialogOpen(true)
    }

    const handleConfirmClear = async () => {
        if (deleteConfirmText !== "DELETE") return;

        setIsDeleting(true);
        const ids = filteredQuestions.map(q => q.id);
        const result = await deleteQuestions(ids);

        setIsDeleting(false);
        setIsClearDialogOpen(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error);
        }
    }

    // OVERVIEW VIEW
    if (view === "overview") {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levels.map((level) => {
                        const count = activeStats[level.code] || 0;
                        return (
                            <Card
                                key={level.id}
                                onClick={() => handleLevelClick(level.code)}
                                className={cn(
                                    "p-6 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden border-2 hover:border-primary/50",
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Layers className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-3xl font-bold text-slate-700">
                                        {count}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">{level.label || level.name}</h3>
                                    <p className="text-sm text-slate-500">{level.description}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Questions <ArrowLeft className="ml-1 h-3 w-3 rotate-180" />
                                </div>
                            </Card>
                        )
                    })}
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="ghost" onClick={() => { setSelectedLevel("All"); setView("detail"); }}>
                        View All Questions
                    </Button>
                </div>

                <QuestionFormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    question={editingQuestion}
                    onSuccess={handleQuestionSaved}
                    levels={levels}
                    categories={categories}
                />
            </div>
        )
    }

    // DETAIL VIEW
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleBackToOverview}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Levels
                    </Button>
                    <div className="h-6 w-px bg-slate-300 mx-2" />
                    <h3 className="text-lg font-bold">
                        {selectedLevel === "All" ? "Question Library" : levels.find(l => l.code === selectedLevel)?.label || selectedLevel}
                    </h3>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{filteredQuestions.length} items</span>
                </div>

                <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Categories</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="destructive" onClick={handleClearAllClick} disabled={filteredQuestions.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear All
                    </Button>

                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                </div>
            </div>

            <QuestionListTable
                questions={filteredQuestions}
                levelFilter={selectedLevel}
                categoryFilter={selectedCategory}
                levels={levels}
                categories={categories}
                onEdit={handleEdit}
            />

            <QuestionFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                question={editingQuestion}
                onSuccess={handleQuestionSaved}
                levels={levels}
                categories={categories}
                defaultLevel={selectedLevel === "All" ? undefined : selectedLevel}
            />

            {/* Clear All Dialog */}
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Questions?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete {filteredQuestions.length} questions in the current view.
                            This action cannot be undone. Questions used in active assessments may not be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-600">Type <span className="font-bold text-red-600">DELETE</span> to confirm.</p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                            className="font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClearDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClear}
                            disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete All"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
