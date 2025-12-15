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
    // Approver Comments
    approver1Good?: string | null;
    approver1Improve?: string | null;
    approver2Good?: string | null;
    approver2Improve?: string | null;
    approver3Good?: string | null;
    approver3Improve?: string | null;
    // Manager Action
    managerAction?: string | null;
    managerReason?: string | null;
    // HR & MD
    hrStatus?: string | null;
    hrNote?: string | null;
    mdDate?: string | Date | null;
    feedbackDate?: string | Date | null;
    gmDate?: string | Date | null;
    gmStatus?: string | null;
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
    titleTh?: string | null;
    titleJa?: string | null;
    descriptionTh?: string | null;
    descriptionJa?: string | null;
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
    formLogo?: string;
    assessmentTitle?: string;
}

export function AssessmentExcelView({
    assessment,
    employee,
    questions,
    responses,
    currentUserId,
    isOwner,
    userRole,
    formLogo,
    assessmentTitle
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
            <div className="bg-white p-4 mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:max-w-none print:w-full">

                {/* Header Row */}
                <div className="flex justify-between items-end border-b-2 border-orange-500 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                        <img
                            src={formLogo || "/logo.png"}
                            alt="Logo"
                            className="h-14 w-auto object-contain"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        {/* Fallback Text Logo if image fails */}
                        <div className="hidden font-bold text-lg text-slate-700">TOKYO RIKA</div>
                    </div>
                    <div className="font-bold text-lg uppercase">{assessmentTitle || "PERSONNEL EVALUATION SHEET"}</div>
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

                {/* Main Assessment Table: Hidden on Mobile, Block on Desktop & Print */}
                <div className="hidden md:block print:block w-full pb-4">
                    <table className="w-full border-collapse border border-black text-[12px] print:text-[12px] print:min-w-0 print:w-full table-fixed text-black">
                        <thead>
                            <tr className="bg-white text-center text-[12px] print:text-[12px]">
                                {/* No Column */}
                                <th rowSpan={3} className="border border-black p-1 w-[40px] bg-slate-50">No</th>

                                {/* Item */}
                                <th rowSpan={3} className="border border-black p-2 bg-slate-50 w-[15%]">
                                    <div>評価項目</div>
                                    <div>หัวข้อการประเมิน</div>
                                </th>

                                {/* Definition */}
                                <th rowSpan={3} className="border border-black p-2 bg-slate-50 w-[35%]">
                                    <div>評価項目の定義</div>
                                    <div>คำอธิบายหัวข้อการประเมิน</div>
                                </th>

                                {/* Self Evaluation */}
                                <th rowSpan={3} className="border border-black p-1 w-[70px] bg-slate-50 vertical-text">
                                    <div className="flex flex-col items-center justify-center h-full gap-1">
                                        <div>自己評価</div>
                                        <div className="text-[10px] leading-tight">พนักงาน<br />ประเมิน<br />ตนเอง</div>
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
                                <th className="border border-black p-1 w-[70px]">
                                    <div>一次考課</div>
                                    <div>ผู้ประเมิน 1</div>
                                </th>
                                <th className="border border-black p-1 w-[70px]">
                                    <div>二次考課</div>
                                    <div>ผู้ประเมิน 2</div>
                                </th>
                                <th className="border border-black p-1 w-[70px]">
                                    <div>三次考課</div>
                                    <div>ผู้ประเมิน 3</div>
                                </th>
                            </tr>
                            {/* Position Row */}
                            <tr className="bg-white text-center text-[10px]">
                                <th className="border border-black p-1 font-normal text-black whitespace-nowrap overflow-hidden text-ellipsis">{isDraft ? 'Sup.' : (employee.approver1_Position || '-')}</th>
                                <th className="border border-black p-1 font-normal text-black whitespace-nowrap overflow-hidden text-ellipsis">{isDraft ? 'Mgr.' : (employee.approver2_Position || '-')}</th>
                                <th className="border border-black p-1 font-normal text-black whitespace-nowrap overflow-hidden text-ellipsis">{isDraft ? 'GM' : (employee.gm_Position || employee.approver3_Position || '-')}</th>
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
                                                    <td colSpan={7} className="border border-black bg-slate-100 font-bold p-2 uppercase tracking-wide">
                                                        {q.category}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr key={q.id}>
                                                <td className="border border-black text-center p-2 align-top">{idx + 1}</td>
                                                <td className="border border-black p-0 align-top font-tahoma bg-white font-normal text-black">
                                                    {q.titleJa && <div className="p-2 text-[10px] font-normal text-black flex items-center bg-gray-50/50 border-b border-gray-200">{q.titleJa}</div>}
                                                    <div className="p-2 min-h-[50px] flex items-center">{q.questionTitle}</div>
                                                </td>
                                                <td className="border border-black p-0 align-top text-black bg-white font-tahoma font-normal">
                                                    {q.descriptionJa && <div className="p-2 text-[10px] font-normal text-black flex items-center bg-gray-50/50 border-b border-gray-200">{q.descriptionJa}</div>}
                                                    <div className="p-2 min-h-[50px] flex items-center">{q.description}</div>
                                                </td>

                                                {/* Self Eval */}
                                                <td className="border border-black text-center p-2 align-top pt-3 font-bold text-black bg-blue-50">
                                                    {fmtScore(res?.scoreSelf)}
                                                </td>

                                                {/* Approver Scores */}
                                                <td className="border border-black text-center p-2 align-top pt-3 text-black">
                                                    {fmtScore(res?.scoreAppr1)}
                                                </td>
                                                <td className="border border-black text-center p-2 align-top pt-3 text-black bg-slate-50">
                                                    {fmtScore(res?.scoreAppr2) === '-' ? '-' : fmtScore(res?.scoreAppr2)}
                                                </td>
                                                <td className="border border-black text-center p-2 align-top pt-3 text-black bg-slate-50">
                                                    {fmtScore(res?.scoreAppr3) === '-' ? '-' : fmtScore(res?.scoreAppr3)}
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

                {/* Mobile View: Cards */}
                <div className="block md:hidden print:hidden space-y-4 px-2">
                    {questions.length === 0 ? (
                        <div className="p-8 text-center border border-slate-200 bg-white rounded-lg italic text-slate-500">No questions configured.</div>
                    ) : (
                        questions.sort((a, b) => a.order - b.order).map((q, idx) => {
                            const res = getResponse(q.id);
                            const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

                            return (
                                <Fragment key={`mobile-${q.id}`}>
                                    {isHeader && (
                                        <div className="font-bold text-lg text-slate-800 pt-4 pb-2 border-b border-orange-200">
                                            {q.category}
                                        </div>
                                    )}
                                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                        {/* Card Header */}
                                        <div className="bg-slate-50 p-3 border-b border-slate-100 flex gap-3">
                                            <div className="bg-orange-100 text-orange-800 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                {q.titleJa && <div className="text-xs text-slate-500 mb-1">{q.titleJa}</div>}
                                                <div className="font-semibold text-sm text-slate-900">{q.questionTitle}</div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-3 text-xs text-slate-600 border-b border-slate-100">
                                            {q.descriptionJa && <div className="mb-2 text-slate-400">{q.descriptionJa}</div>}
                                            <div>{q.description}</div>
                                        </div>

                                        {/* Card Footer: Scores */}
                                        <div className="p-3 flex items-center justify-between gap-4 bg-slate-50/50">
                                            {/* Self Score */}
                                            <div className="flex-1 text-center">
                                                <div className="text-[10px] uppercase font-bold text-blue-600 mb-1">Self</div>
                                                <div className="text-xl font-bold text-blue-900 bg-white border border-blue-200 rounded p-2 shadow-sm">
                                                    {fmtScore(res?.scoreSelf)}
                                                </div>
                                            </div>

                                            {/* Approver Scores */}
                                            <div className="flex gap-2">
                                                <div className="text-center">
                                                    <div className="text-[9px] text-slate-400 mb-1">APP 1</div>
                                                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                                                        {fmtScore(res?.scoreAppr1)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[9px] text-slate-400 mb-1">APP 2</div>
                                                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm">
                                                        {fmtScore(res?.scoreAppr2) === '-' ? '-' : fmtScore(res?.scoreAppr2)}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[9px] text-slate-400 mb-1">APP 3</div>
                                                    <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm">
                                                        {fmtScore(res?.scoreAppr3) === '-' ? '-' : fmtScore(res?.scoreAppr3)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Fragment>
                            )
                        })
                    )}
                </div>
            </div>

            {/* 
                PAGE 2: Comments & Signatures Logic
                Forced page break for print
            */}
            <div className="bg-white p-4 mx-auto w-full max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:break-before-page flex flex-col justify-between">

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
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                                valueGood: assessment.approver1Good,
                                valueImprove: assessment.approver1Improve
                            },
                            {
                                title: "2nd Evaluator",
                                nameLabel: "Name",
                                user: isDraft ? "Manager" : (employee.approver2_Name || '-'),
                                code: employee.approver2_ID,
                                date: assessment.approver2Date,
                                goodPoints: "Good Points (ข้อดี)",
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                                valueGood: assessment.approver2Good,
                                valueImprove: assessment.approver2Improve
                            },
                            {
                                title: "Final Evaluator",
                                nameLabel: "Name",
                                user: isDraft ? "GM / MD" : (employee.gm_Name || employee.approver3_Name || '-'),
                                code: employee.gm_ID || employee.approver3_ID,
                                date: assessment.mdDate || assessment.approver3Date,
                                goodPoints: "Good Points (ข้อดี)",
                                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                                valueGood: assessment.approver3Good,
                                valueImprove: assessment.approver3Improve
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
                                        <div className="text-[11px] whitespace-pre-wrap mt-1 px-1">
                                            {evaluator.valueGood || '-'}
                                        </div>
                                    </div>

                                    {/* Bottom: Improvement Points */}
                                    <div className="flex-1 p-2 relative">
                                        <div className="text-[10px] font-bold text-slate-700 bg-slate-50 inline-block px-1 rounded mb-1">
                                            {evaluator.improvePoints}
                                        </div>
                                        <div className="text-[11px] whitespace-pre-wrap mt-1 px-1">
                                            {evaluator.valueImprove || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Combined Manager Action & HR Section for Print Compactness */}
                <div className="mt-4 border-t-2 border-orange-500 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Manager Action & GM Verification (50% width -> 6 cols) */}
                        <div className="md:col-span-6 flex flex-col gap-4">
                            {/* Manager Action Display */}
                            <div className="border border-black text-[10px]">
                                <div className="text-center font-bold border-b border-black p-1 bg-white">
                                    Applied by Manager up
                                </div>
                                <div className="text-center border-b border-black p-1 bg-white italic text-[9px]">
                                    (いずれかにチェック   กรุณาขีดถูกหน้าข้อใดข้อหนึ่ง)
                                </div>

                                <div className="grid grid-cols-2">
                                    {/* Left Column: No Change & Demotion */}
                                    <div className="border-r border-black border-dashed">
                                        {/* Row 1: No Change */}
                                        <div className="border-b border-black border-dashed p-1 h-14 flex items-start gap-2">
                                            <div className={`mt-1 w-3 h-3 border border-black ${assessment.managerAction === 'NO_CHANGE' ? 'bg-black' : 'bg-white'} flex-shrink-0`}></div>
                                            <div>
                                                <div className="font-bold">昇格・降格なし</div>
                                                <div>ไม่มีการปรับเลื่อนตำแหน่งขึ้น・ลดตำแหน่งลง</div>
                                            </div>
                                        </div>
                                        {/* Row 2: Demotion */}
                                        <div className="p-1 h-14 flex items-start gap-2">
                                            <div className={`mt-1 w-3 h-3 border border-black ${assessment.managerAction === 'DEMOTION' ? 'bg-black' : 'bg-white'} flex-shrink-0`}></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="font-bold">降格</span>
                                                    <span className="text-red-500 font-bold">理由（必須）</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>ลดตำแหน่ง</span>
                                                    <span className="text-red-500">เหตุผล (บังคับ)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Promotion & Termination */}
                                    <div>
                                        {/* Row 1: Promotion */}
                                        <div className="border-b border-black border-dashed p-1 h-14 flex items-start gap-2">
                                            <div className={`mt-1 w-3 h-3 border border-black ${assessment.managerAction === 'PROMOTION' ? 'bg-black' : 'bg-white'} flex-shrink-0`}></div>
                                            <div>
                                                <div className="font-bold">昇格 (推薦)</div>
                                                <div>ปรับเลื่อนตำแหน่งขึ้น (เสนอ)</div>
                                            </div>
                                        </div>
                                        {/* Row 2: Termination */}
                                        <div className="p-1 h-14 flex items-start gap-2">
                                            <div className={`mt-1 w-3 h-3 border border-black ${assessment.managerAction === 'TERMINATION' ? 'bg-black' : 'bg-white'} flex-shrink-0`}></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="font-bold">解雇</span>
                                                    <span className="text-red-500 font-bold">理由（必須）</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>เลิกจ้าง</span>
                                                    <span className="text-red-500">เหตุผล (บังคับ)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Demotion/Termination Reason Text Area if Needed */}
                                {(assessment.managerAction === 'DEMOTION' || assessment.managerAction === 'TERMINATION') && assessment.managerReason && (
                                    <div className="border-t border-black p-1 bg-slate-50 italic">
                                        Reason: {assessment.managerReason}
                                    </div>
                                )}

                                <div className="border-t border-black p-1 text-[9px]">
                                    上記内容に相違はありません。
                                </div>
                                <div className="p-1 text-[9px] mb-2">
                                    รับรองข้อความข้างต้นเป็นจริงทุกประการ
                                </div>

                                <div className="flex border-t border-black">
                                    <div className="flex-1"></div>
                                    <div className="w-16 flex items-center justify-center p-1 font-bold">Signature</div>
                                    <div className="w-32 border-l border-b border-black bg-slate-50"></div>
                                </div>
                                <div className="flex">
                                    <div className="flex-1"></div>
                                    <div className="w-16 flex items-center justify-center p-1 font-bold">Name</div>
                                    <div className="w-32 border-l border-black p-1 text-center font-bold">
                                        {/* Dynamic Manager Name */}
                                        {assessment.employee?.manager_Name || 'Manager'}
                                    </div>
                                </div>
                                <div className="flex justify-end pr-8 pb-1">
                                    <div className="text-center tracking-widest text-[9px]">
                                        {assessment.managerDate ? formatDate(assessment.managerDate) : '/   /'}
                                    </div>
                                </div>
                            </div>

                            {/* GM Verification - Moved here below Manager */}
                            <div className="border border-black text-[10px]">
                                <div className="text-center font-bold border-b border-black p-1 bg-white">
                                    Confirmed by GM up
                                </div>

                                <div className="border-t border-black p-1 text-[9px] mt-8">
                                    上記内容に相違はありません。
                                </div>
                                <div className="p-1 text-[9px] mb-2">
                                    รับรองข้อความข้างต้นเป็นจริงทุกประการ
                                </div>

                                <div className="flex border-t border-black">
                                    <div className="flex-1"></div>
                                    <div className="w-16 flex items-center justify-center p-1 font-bold">Signature</div>
                                    <div className="w-40 border-l border-b border-black bg-slate-50 flex items-center justify-center relative">
                                        {/* GM Signed */}
                                        <div className={`absolute right-1 bottom-1 w-6 h-6 border rounded-full flex items-center justify-center text-[8px] transform rotate-12 ${assessment.gmStatus === 'APPROVED' ? 'border-red-600 text-red-600' : 'border-gray-300 text-gray-300'}`}>
                                            印
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="flex-1">
                                        {/* GM Verification Checkbox added for clarity if needed, or stick to signature */}
                                        <div className="hidden">
                                            <div className={`w-3 h-3 border border-black ${assessment.gmStatus === 'APPROVED' || assessment.status === 'COMPLETED' ? 'bg-black' : 'bg-white'}`}></div>
                                        </div>
                                    </div>
                                    <div className="w-16 flex items-center justify-center p-1 font-bold">Name</div>
                                    <div className="w-40 border-l border-black p-1 text-center font-bold">
                                        {/* Dynamic GM Name */}
                                        {assessment.employee?.gm_Name || 'Authorized GM'}
                                    </div>
                                </div>
                                <div className="flex justify-end pr-8 pb-1">
                                    <div className="text-center tracking-widest text-[9px]">
                                        {assessment.gmDate ? formatDate(assessment.gmDate) : '/   /'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* HR Review (25% width -> 3 cols) - Simplified Layout */}
                        <div className="md:col-span-3">
                            <div className="border border-black text-[10px] bg-white h-auto">
                                <div className="text-center font-bold border-b border-black p-1 bg-white">
                                    Summary and Record
                                    <span className="text-[9px] text-red-500 ml-1 font-normal block">(Debug: HR={assessment.hrStatus}/{assessment.hrDate ? 'Y' : 'N'})</span>
                                </div>
                                <div className="text-center font-bold text-red-600 border-b border-black p-1 bg-white text-[9px]">
                                    Promote Recommend Meeting (Only Dec.)
                                </div>

                                <div className="border-b border-black flex h-12">
                                    <div className="w-8 border-r border-black flex items-center justify-center p-1 bg-slate-50">
                                        <div className={`w-3 h-3 border border-black ${assessment.hrStatus === 'Approved' || !!assessment.hrDate ? 'bg-black' : 'bg-white'}`}></div>
                                    </div>
                                    <div className="flex-1 p-1 flex items-center">
                                        <div>
                                            <span className="font-bold block">承認</span>
                                            อนุมัติ
                                        </div>
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="w-8 border-r border-black flex items-center justify-center p-1 bg-slate-50">
                                        <div className={`w-3 h-3 border border-black ${assessment.hrStatus === 'Rejected' ? 'bg-black' : 'bg-white'}`}></div>
                                    </div>
                                    <div className="flex-1 p-1 flex items-center">
                                        <div>
                                            <span className="font-bold block">否認</span>
                                            ไม่อนุมัติ
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MD Review (25% width -> 3 cols) - New Table Layout */}
                        <div className="md:col-span-3 flex flex-col gap-4">
                            <div className="border border-black text-[10px] bg-white">
                                <div className="text-center font-bold border-b border-black p-1 bg-slate-50">
                                    Approved by MD
                                    <span className="text-[9px] text-red-500 block font-normal">(Debug: MD={assessment.mdStatus}/{assessment.mdDate ? 'Y' : 'N'})</span>
                                </div>

                                <div className="border-b border-black flex">
                                    <div className="w-8 border-r border-black flex items-center justify-center p-1 bg-slate-50">
                                        <div className={`w-3 h-3 border border-black ${assessment.mdStatus === 'Approved' || !!assessment.mdDate ? 'bg-black' : 'bg-white'}`}></div>
                                    </div>
                                    <div className="flex-1 p-1 flex items-center">
                                        <span className="mr-2 font-bold">承認</span> อนุมัติ
                                    </div>
                                </div>

                                <div className="border-b border-black flex">
                                    <div className="w-8 border-r border-black flex items-center justify-center p-1 bg-slate-50">
                                        <div className={`w-3 h-3 border border-black ${assessment.mdStatus === 'Rejected' ? 'bg-black' : 'bg-white'}`}></div>
                                    </div>
                                    <div className="flex-1 p-1 flex items-center">
                                        <span className="mr-2 font-bold">否認</span> ไม่อนุมัติ
                                    </div>
                                </div>

                                <div className="flex h-16 border-b border-black">
                                    <div className="w-16 border-r border-black p-1 flex items-center justify-center font-bold bg-slate-50">Signature</div>
                                    <div className="flex-1 p-1 relative">
                                        {/* Signature Placeholder */}
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="w-16 border-r border-black bg-slate-50"></div>
                                    <div className="flex-1 text-center p-1 tracking-[0.5em]">
                                        {assessment.mdDate ? formatDate(assessment.mdDate) : '/   /'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
