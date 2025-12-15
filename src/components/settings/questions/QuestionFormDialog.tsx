"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { AssessmentQuestion, QuestionCategory, ApplicableLevel } from "@/types/assessment"
import type { AssessmentLevel, AssessmentCategory } from "@prisma/client"
import { createQuestion, updateQuestion } from "@/actions/questions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

type SerializedAssessmentLevel = Omit<AssessmentLevel, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

type SerializedAssessmentCategory = Omit<AssessmentCategory, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

interface QuestionFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    question?: AssessmentQuestion | null
    onSuccess: () => void
    levels: SerializedAssessmentLevel[]
    categories: SerializedAssessmentCategory[]
    defaultLevel?: string
    nextOrder?: number
}

type FormData = {
    questionTitle: string
    description: string
    category: string
    applicableLevel: string
    order: number
    weight: number // Hidden but required by schema
    // Dual Language
    titleTh: string
    titleJa: string
    descriptionTh: string
    descriptionJa: string
    categoryTh: string
    categoryJa: string
}


export function QuestionFormDialog({ open, onOpenChange, question, onSuccess, levels = [], categories = [], defaultLevel, nextOrder }: QuestionFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const { register, control, handleSubmit, reset, setValue } = useForm<FormData>({
        defaultValues: {
            questionTitle: "",
            description: "",
            category: categories.length > 0 ? categories[0].name : "",
            applicableLevel: defaultLevel || "L3-General",
            order: nextOrder || 1
        }
    })

    useEffect(() => {
        if (question) {
            reset({
                questionTitle: question.questionTitle,
                description: question.description || "",
                category: question.category,
                applicableLevel: question.applicableLevel,
                order: question.order,
                titleTh: question.titleTh || "",
                titleJa: question.titleJa || "",
                descriptionTh: question.descriptionTh || "",
                descriptionJa: question.descriptionJa || "",
                categoryTh: question.categoryTh || "",
                categoryJa: question.categoryJa || ""
            })
        } else {
            reset({
                questionTitle: "",
                description: "",
                category: categories.length > 0 ? categories[0].name : "",
                applicableLevel: defaultLevel || "L3-General",
                order: nextOrder || 1,
                titleTh: "",
                titleJa: "",
                descriptionTh: "",
                descriptionJa: "",
                categoryTh: "",
                categoryJa: ""
            })
        }
    }, [question, reset, defaultLevel, categories, nextOrder])

    const onSubmit = async (data: FormData) => {
        setIsLoading(true)
        try {
            if (question) {
                const res = await updateQuestion(question.id, {
                    ...data,
                    category: data.category as QuestionCategory,
                    applicableLevel: data.applicableLevel as ApplicableLevel
                })
                if (!res.success) throw new Error(res.error)
            } else {
                const res = await createQuestion({
                    ...data,
                    category: data.category as QuestionCategory,
                    applicableLevel: data.applicableLevel as ApplicableLevel,
                    isActive: true,
                    maxScore: 5
                })
                if (!res.success) throw new Error(res.error)
            }
            onSuccess()
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to save question")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{question ? "Edit Question" : "New Question"}</DialogTitle>
                    <DialogDescription>
                        {question ? "Update the details of the assessment question." : "Create a new question for the assessment template."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="py-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Level</label>
                                <Controller
                                    control={control}
                                    name="applicableLevel"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {levels.map(l => (
                                                    <SelectItem key={l.code} value={l.code}>{l.label || l.name}</SelectItem>
                                                ))}
                                                <SelectItem value="All">All Levels</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Question (Thai/Eng)</label>
                                <Input {...register("questionTitle", { required: true })} placeholder="e.g. Technical Knowledge" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Question (Japanese)</label>
                                <Input {...register("titleJa")} placeholder="タイトル (日本語)" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description (Thai/Eng)</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register("description")}
                                    placeholder="Detailed description..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description (Japanese)</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-gray-200"
                                    {...register("descriptionJa")}
                                    placeholder="説明 (日本語)..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Display Order</label>
                            <Input type="number" {...register("order", { valueAsNumber: true })} className="w-1/3" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Question"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
