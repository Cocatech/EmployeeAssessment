"use client"

import { AssessmentQuestion } from "@/types/assessment"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Power, PowerOff } from "lucide-react"
import { deleteQuestion, toggleQuestionStatus } from "@/actions/questions"
import { useRouter } from "next/navigation"
import { AssessmentCategory, AssessmentLevel } from "@prisma/client" // Added AssessmentCategory and AssessmentLevel

type SerializedAssessmentLevel = Omit<AssessmentLevel, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

type SerializedAssessmentCategory = Omit<AssessmentCategory, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
}

interface QuestionListTableProps {
    questions: AssessmentQuestion[]
    levelFilter: string // Added
    categoryFilter?: string // Added
    levels: SerializedAssessmentLevel[] // Added
    categories?: SerializedAssessmentCategory[] // Added
    onEdit: (question: AssessmentQuestion) => void
}

export function QuestionListTable({ questions, onEdit }: QuestionListTableProps) {
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this question?")) {
            await deleteQuestion(id)
            router.refresh()
        }
    }

    const handleToggle = async (id: string) => {
        await toggleQuestionStatus(id)
        router.refresh()
    }

    if (questions.length === 0) {
        return <div className="p-8 text-center border rounded-lg bg-gray-50 text-gray-500">No questions found matching your filter.</div>
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <tr>
                        <th className="p-3 w-16 text-center">Order</th>
                        <th className="p-3 w-24">Level</th>
                        <th className="p-3 w-32">Category</th>
                        <th className="p-3">Question Item / Definition</th>
                        <th className="p-3 w-24 text-center">Status</th>
                        <th className="p-3 w-32 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {questions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-mono text-slate-500">{q.order}</td>
                            <td className="p-3">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-800">
                                    {q.applicableLevel}
                                </span>
                            </td>
                            <td className="p-3 text-xs font-medium text-slate-600">
                                {q.category}
                            </td>
                            <td className="p-3">
                                <div className="font-semibold">{q.questionTitle}</div>
                                {q.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{q.description}</div>}
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => handleToggle(q.id)}
                                    className={`inline-flex items-center justify-center p-1 rounded-full ${q.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                    title={q.isActive ? "Active" : "Inactive"}
                                >
                                    {q.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                                </button>
                            </td>
                            <td className="p-3 text-center space-x-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(q)}>
                                    <Edit2 size={16} className="text-blue-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(q.id)}>
                                    <Trash2 size={16} className="text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
