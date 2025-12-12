"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { AssessmentQuestion, QuestionCategory, ApplicableLevel } from "@/types/assessment"
import type { AssessmentLevel } from "@prisma/client"
import { createQuestion, updateQuestion } from "@/actions/questions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

type FormData = {
    questionTitle: string
    description: string
    category: string
    applicableLevel: string
    order: number
    weight: number // Hidden but required by schema
}

export function QuestionFormDialog({ open, onOpenChange, question, onSuccess, levels = [], categories = [], defaultLevel }: QuestionFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const { register, control, handleSubmit, reset, setValue } = useForm<FormData>({
        defaultValues: {
            questionTitle: "",
            description: "",
            category: categories.length > 0 ? categories[0].name : "",
            applicableLevel: defaultLevel || "L3-General",
            order: 1
        }
    })

    useEffect(() => {
        if (question) {
            reset({
                questionTitle: question.questionTitle,
                description: question.description || "",
                category: question.category,
                applicableLevel: question.applicableLevel,
                order: question.order
            })
        } else {
            reset({
                questionTitle: "",
                description: "",
                category: categories.length > 0 ? categories[0].name : "",
                applicableLevel: defaultLevel || "L3-General",
                order: 1
            })
        }
    }, [question, reset, defaultLevel, categories])

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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{question ? "Edit Question" : "New Question"}</DialogTitle>
                    <DialogDescription>
                        {question ? "Update the details of the assessment question." : "Create a new question for the assessment template."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Question Item (Thai/Eng)</label>
                        <Input {...register("questionTitle", { required: true })} placeholder="e.g. Technical Knowledge / ความรู้ด้านเทคนิค" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Definition / Description</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("description")}
                            placeholder="Detailed description of the criteria..."
                        />
                    </div>

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
                                            {/* Allow 'Other' if needed via custom input? For now fixed list is safer */}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Display Order</label>
                            <Input type="number" {...register("order", { valueAsNumber: true })} />
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
