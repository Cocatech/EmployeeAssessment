'use client';

import { Fragment } from 'react';
import { Card } from '@/components/ui/card';

// Define flexible interfaces that match the data passed from Server Components
// Server components serialize Dates to strings when passing to Client Components.

interface ExcelViewAssessment {
    id: string;
    status: string;
    periodStart: string | Date;
    periodEnd: string | Date;
    dueDate: string | Date;
    assessmentType: string;
    [key: string]: any; // Allow other fields
}

interface ExcelViewEmployee {
    empCode: string;
    empName_Eng: string;
    position: string;
    group: string;
    assessmentLevel: string;
    employeeType: string;
    joinDate?: string | Date | null;
    [key: string]: any;
}

interface ExcelViewQuestion {
    id: string;
    questionTitle: string;
    description?: string | null;
    category: string;
    weight: number;
    order: number;
    [key: string]: any;
}

interface ExcelViewResponse {
    questionId: string;
    scoreSelf?: number | null;
    scoreAppr1?: number | null;
    scoreAppr2?: number | null;
    scoreAppr3?: number | null;
    commentSelf?: string | null;
    commentAppr1?: string | null;
    commentAppr2?: string | null;
    commentAppr3?: string | null;
    [key: string]: any;
}

interface AssessmentExcelViewProps {
    assessment: ExcelViewAssessment;
    employee: ExcelViewEmployee;
    questions: ExcelViewQuestion[];
    responses: Map<string, ExcelViewResponse>;
    currentUserId: string;
    isOwner: boolean;
    userRole?: string;
}

export function AssessmentExcelView({
    assessment,
    employee,
    questions,
    responses,
    currentUserId,
    isOwner,
    userRole
}: AssessmentExcelViewProps) {

    // Helper to get response safely
    const getResponse = (questionId: string) => responses.get(questionId);

    // Calculate totals
    const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 0), 0);

    // Format score
    const fmtScore = (score: number | null | undefined) => {
        return score !== null && score !== undefined ? score.toFixed(2) : '-';
    };

    const formatDate = (date: string | Date | undefined | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };



    // Check if it is a draft/template
    const isDraft = assessment.status === 'Draft' || assessment.isDraft;

    // Display values
    const displayName = isDraft ? 'TEMPLATE / DRAFT' : employee.empName_Eng;
    const displayEmpCode = isDraft ? 'N/A' : employee.empCode;
    const displayPosition = isDraft ? 'N/A' : employee.position;
    const displayGroup = isDraft ? 'N/A' : employee.group;
    const displayLevel = isDraft ? (assessment.targetLevel || 'See Target Level') : employee.assessmentLevel;
    const displayJoinDate = isDraft ? '-' : formatDate(employee.joinDate);
    const profileImage = !isDraft && employee.profileImage ? employee.profileImage : '/placeholder-user.jpg';

    return (
        <div className="space-y-6 print:space-y-0 text-xs text-black font-sans">
            {/* 
                PAGE 1: Info & Assessment Items 
                Using a fixed width container that mimics A4 width (~210mm)
             */}
            <div className="bg-white p-4 mx-auto max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0">

                {/* Header Row */}
                <div className="flex justify-between items-end border-b-2 border-orange-500 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-10 w-auto object-contain"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        {/* Fallback Text Logo if image fails */}
                        <div className="hidden font-bold text-lg text-slate-700">TOKYO RIKA</div>
                    </div>
                    <div className="font-bold text-lg">PERSONNEL EVALUATION SHEET</div>
                    <div className="text-[10px] text-right">
                        <div>Confidential</div>
                        <div>Ref: {assessment.id.substring(0, 8)}</div>
                    </div>
                </div>

                {/* Employee Info Grid - Mimicking the Top Section of Image */}
                <div className="border-2 border-orange-500 mb-4">
                    <div className="grid grid-cols-[1fr_120px] gap-0">
                        {/* Info Fields */}
                        <div className="grid grid-cols-4 border-r border-slate-300">
                            {/* Row 1 */}
                            <div className="bg-orange-100 p-1 border-b border-r border-slate-300 font-semibold flex items-center">Period</div>
                            <div className="p-1 border-b border-r border-slate-300 col-span-3 flex items-center">
                                {formatDate(assessment.periodStart)} - {formatDate(assessment.periodEnd)}
                            </div>

                            {/* Row 2 */}
                            <div className="bg-orange-100 p-1 border-b border-r border-slate-300 font-semibold flex items-center">Emp ID</div>
                            <div className="p-1 border-b border-r border-slate-300 flex items-center font-mono">{displayEmpCode}</div>
                            <div className="bg-orange-100 p-1 border-b border-r border-slate-300 font-semibold flex items-center">Name</div>
                            <div className="p-1 border-b border-slate-300 flex items-center font-bold px-2 text-sm">{displayName}</div>

                            {/* Row 3 */}
                            <div className="bg-orange-100 p-1 border-b border-r border-slate-300 font-semibold flex items-center">Department</div>
                            <div className="p-1 border-b border-r border-slate-300 flex items-center">{displayGroup}</div>
                            <div className="bg-orange-100 p-1 border-b border-r border-slate-300 font-semibold flex items-center">Position</div>
                            <div className="p-1 border-b border-slate-300 flex items-center">{displayPosition}</div>

                            {/* Row 4 */}
                            <div className="bg-orange-100 p-1 border-r border-slate-300 font-semibold flex items-center">Level</div>
                            <div className="p-1 border-r border-slate-300 flex items-center">{displayLevel}</div>
                            <div className="bg-orange-100 p-1 border-r border-slate-300 font-semibold flex items-center">Join Date</div>
                            <div className="p-1 border-slate-300 flex items-center">{displayJoinDate}</div>
                        </div>

                        {/* Photo Section */}
                        <div className="flex items-center justify-center p-2 bg-slate-50">
                            <div className="w-20 h-24 border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
                                {isDraft ? (
                                    <span className="text-slate-300 text-[10px]">PHOTO</span>
                                ) : (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating Guide - Compact */}
                <div className="border border-black mb-4 text-[10px]">
                    <div className="grid grid-cols-5 divide-x divide-black text-center bg-slate-50">
                        <div className="p-1"><b className="block text-lg">1</b>Needs Improvement</div>
                        <div className="p-1"><b className="block text-lg">2</b>Fair</div>
                        <div className="p-1"><b className="block text-lg">3</b>Good</div>
                        <div className="p-1"><b className="block text-lg">4</b>Very Good</div>
                        <div className="p-1"><b className="block text-lg">5</b>Excellent</div>
                    </div>
                </div>

                {/* Main Assessment Table */}
                <table className="w-full border-collapse border border-black text-[10px]">
                    <thead>
                        <tr className="bg-white text-center text-xs">
                            {/* No Column */}
                            <th rowSpan={3} className="border border-black p-1 w-8 bg-slate-50">No</th>

                            {/* Item */}
                            <th rowSpan={3} className="border border-black p-2 bg-slate-50">
                                <div>評価項目</div>
                                <div>หัวข้อการประเมิน</div>
                            </th>

                            {/* Definition */}
                            <th rowSpan={3} className="border border-black p-2 bg-slate-50 w-1/3">
                                <div>評価項目の定義</div>
                                <div>คำอธิบายหัวข้อการประเมิน</div>
                            </th>

                            {/* Self Evaluation */}
                            <th rowSpan={3} className="border border-black p-1 w-16 bg-slate-50 vertical-text">
                                <div className="flex flex-col items-center justify-center h-full gap-1">
                                    <div>自己評価</div>
                                    <div className="text-[10px]">พนักงานประเมิน<br />ตนเอง</div>
                                </div>
                            </th>

                            {/* Evaluation Result (Group) */}
                            <th colSpan={3} className="border border-black p-1 bg-slate-50">
                                <div>考課結果</div>
                                <div>ผลการประเมิน</div>
                            </th>
                        </tr>
                        {/* Evaluator Levels Row */}
                        <tr className="bg-white text-center text-[10px]">
                            <th className="border border-black p-1 w-20">
                                <div>一次考課</div>
                                <div>ผู้ประเมินคนที่ 1</div>
                            </th>
                            <th className="border border-black p-1 w-20">
                                <div>二次考課</div>
                                <div>ผู้ประเมินคนที่ 2</div>
                            </th>
                            <th className="border border-black p-1 w-20">
                                <div>三次考課</div>
                                <div>ผู้ประเมินคนที่ 3</div>
                            </th>
                        </tr>
                        {/* Position Row */}
                        <tr className="bg-white text-center text-[10px]">
                            <th className="border border-black p-1 font-normal text-slate-500">Position</th>
                            <th className="border border-black p-1 font-normal text-slate-500">Position</th>
                            <th className="border border-black p-1 font-normal text-slate-500">Position</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center border border-black italic">No questions configured for this level.</td></tr>
                        ) : (
                            questions.sort((a, b) => a.order - b.order).map((q, idx) => {
                                const res = getResponse(q.id);
                                const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

                                return (
                                    <Fragment key={q.id}>
                                        {isHeader && (
                                            <tr key={`h-${q.category}`}>
                                                <td colSpan={7} className="border border-black bg-slate-100 font-bold p-1 px-2 uppercase tracking-wide text-[11px]">
                                                    {q.category}
                                                </td>
                                            </tr>
                                        )}
                                        <tr key={q.id}>
                                            <td className="border border-black text-center p-1">{idx + 1}</td>
                                            <td className="border border-black p-1 align-top font-semibold">
                                                {q.questionTitle}
                                            </td>
                                            <td className="border border-black p-1 align-top text-slate-500">
                                                {q.description}
                                            </td>
                                            <td className="border border-black text-center p-1 font-bold bg-blue-50">{fmtScore(res?.scoreSelf)}</td>
                                            <td className="border border-black text-center p-1 font-bold">{fmtScore(res?.scoreAppr1)}</td>
                                            <td className="border border-black text-center p-1 font-bold bg-slate-50 text-slate-400">
                                                {fmtScore(res?.scoreAppr2) === '-' ? '' : fmtScore(res?.scoreAppr2)}
                                            </td>
                                            <td className="border border-black text-center p-1 font-bold bg-slate-50 text-slate-400">
                                                {fmtScore(res?.scoreAppr3) === '-' ? '' : fmtScore(res?.scoreAppr3)}
                                            </td>
                                        </tr>
                                    </Fragment>
                                );
                            })
                        )}
                        {/* Total Row */}
                        <tr className="bg-orange-100 font-bold border-t-2 border-black">
                            <td colSpan={3} className="border border-black p-1 text-right">TOTAL</td>
                            <td className="border border-black p-1 text-center"></td>
                            <td className="border border-black p-1 text-center"></td>
                            <td className="border border-black p-1 text-center"></td>
                            <td className="border border-black p-1 text-center"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 
                PAGE 2: Comments & Signatures Logic
                Forced page break for print
            */}
            <div className="bg-white p-4 mx-auto max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:break-before-page flex flex-col justify-between">

                {/* Comments Section */}
                <div>
                    <div className="border-b-2 border-orange-500 mb-4 font-bold text-lg">EVALUATION SUMMARY & COMMENTS</div>

                    {/* 
                         PAGE 2: Comments & Signatures (Combined)
                     */}
                    <div className="space-y-0 border-t border-l border-black">
                        {[
                            {
                                title: "1st Evaluator",
                                nameLabel: "Name",
                                user: isDraft ? "Supervisor" : (employee.approver1_Name || '-'),
                                code: employee.approver1_ID,
                                date: assessment.approver1Date,
                                goodPoints: "Good Points (ข้อดี)",
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)"
                            },
                            {
                                title: "2nd Evaluator",
                                nameLabel: "Name",
                                user: isDraft ? "Manager" : (employee.approver2_Name || '-'),
                                code: employee.approver2_ID,
                                date: assessment.approver2Date,
                                goodPoints: "Good Points (ข้อดี)",
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)"
                            },
                            {
                                title: "Final Evaluator",
                                nameLabel: "Name",
                                user: isDraft ? "GM / MD" : (employee.gm_Name || employee.approver3_Name || '-'),
                                code: employee.gm_ID || employee.approver3_ID,
                                date: assessment.mdDate || assessment.approver3Date,
                                goodPoints: "Good Points (ข้อดี)",
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)"
                            }
                        ].map((evaluator, i) => (
                            <div key={i} className="flex h-[200px] border-b border-r border-black">
                                {/* Left Column: Info & Signature */}
                                <div className="w-[200px] border-r border-black p-2 flex flex-col justify-between shrink-0 bg-slate-50">
                                    <div>
                                        <div className="font-bold text-xs mb-1">{evaluator.title}</div>
                                        <div className="text-[10px] text-slate-500 mb-4 h-8 overflow-hidden">
                                            {evaluator.user}
                                            {evaluator.code && <div className='opacity-50 text-[9px]'>{evaluator.code}</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-[10px] text-slate-400">Signature</div>
                                        <div className="border-b border-black h-8"></div>
                                        <div className="flex items-end gap-1 text-[10px] pt-1">
                                            <span>Date</span>
                                            <span className="flex-1 border-b border-dotted border-black text-center">
                                                {formatDate(evaluator.date) !== '-' ? formatDate(evaluator.date) : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Comments (Split) */}
                                <div className="flex-1 flex flex-col">
                                    {/* Top: Good Points */}
                                    <div className="flex-1 border-b border-black p-2 relative">
                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 inline-block px-1 rounded mb-1">
                                            {evaluator.goodPoints}
                                        </div>
                                        <div className="absolute inset-0 top-6 p-2">
                                            <div className="w-full h-full border-b border-dotted border-slate-200" />
                                            {/* Note content would go here */}
                                        </div>
                                    </div>

                                    {/* Bottom: Improvement Points */}
                                    <div className="flex-1 p-2 relative">
                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 inline-block px-1 rounded mb-1">
                                            {evaluator.improvePoints}
                                        </div>
                                        <div className="absolute inset-0 top-6 p-2">
                                            <div className="w-full h-full border-b border-dotted border-slate-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

}
