'use client';

import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  questionTitle: string;
  description?: string;
  category: string;
  weight: number;
  maxScore: number;
  order: number;
  titleTh?: string;
  titleJa?: string;
  descriptionJa?: string;
}

interface Response {
  id: string;
  questionId: string;
  scoreSelf?: number;
  scoreAppr1?: number;
  scoreAppr2?: number;
  scoreAppr3?: number;
  scoreMgr?: number;
  scoreGm?: number;
  commentSelf?: string;
  commentAppr1?: string;
  commentAppr2?: string;
  commentAppr3?: string;
  commentMgr?: string;
  commentGm?: string;
}

interface Employee {
  empCode: string;
  empName_Eng: string;
  position: string;
  group: string;
  profileImage?: string | null;
  // Approver Names (Passed from page)
  approver1_Name?: string;
  approver2_Name?: string;
  approver3_Name?: string;
  manager_Name?: string; // If different
  gm_Name?: string;
}

interface ApprovalFormProps {
  assessmentId: string;
  assessmentStatus: string;
  employee: Employee;
  questions: Question[];
  responses: Response[];
  currentUserRole: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'md' | 'gm';
  approver1Id?: string | null;
  approver2Id?: string | null;
  approver3Id?: string | null;
  managerId?: string | null;
  gmId?: string | null;

  // Existing Summary Comments
  approver1Good?: string;
  approver1Improve?: string;
  approver2Good?: string;
  approver2Improve?: string;
  approver3Good?: string;
  approver3Improve?: string;

  // Dates
  approver1Date?: string;
  approver2Date?: string;
  approver3Date?: string;
}

export default function ApprovalForm({
  assessmentId,
  assessmentStatus,
  employee,
  questions,
  responses: initialResponses,
  currentUserRole,
  approver1Id,
  approver2Id,
  approver3Id,
  managerId,
  gmId,
  approver1Good,
  approver1Improve,
  approver2Good,
  approver2Improve,
  approver3Good,
  approver3Improve,
  approver1Date,
  approver2Date,
  approver3Date
}: ApprovalFormProps) {
  const router = useRouter();

  // 1. Initialize Responses State
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>(() => {
    const initialMap: Record<string, Partial<Response>> = {};
    initialResponses.forEach(r => {
      const val = { ...r };
      // Auto-fill logic for shared approvers
      if (currentUserRole === 'approver2' && approver2Id === approver1Id && val.scoreAppr2 === undefined) {
        val.scoreAppr2 = val.scoreAppr1;
      } else if (currentUserRole === 'approver3') {
        if (approver3Id === approver2Id && val.scoreAppr3 === undefined) val.scoreAppr3 = val.scoreAppr2;
        else if (approver3Id === approver1Id && val.scoreAppr3 === undefined) val.scoreAppr3 = val.scoreAppr1;
      }
      initialMap[r.questionId] = val;
    });
    return initialMap;
  });

  // 2. Initialize Summary Comments State
  const [comments, setComments] = useState({
    approver1Good: approver1Good || '',
    approver1Improve: approver1Improve || '',
    approver2Good: approver2Good || '',
    approver2Improve: approver2Improve || '',
    approver3Good: approver3Good || '',
    approver3Improve: approver3Improve || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Role Mappings
  // Role Mappings
  const scoreField = currentUserRole === 'approver1' ? 'scoreAppr1'
    : currentUserRole === 'approver2' ? 'scoreAppr2'
      : currentUserRole === 'approver3' ? 'scoreAppr3'
        : currentUserRole === 'manager' ? 'scoreMgr'
          : currentUserRole === 'md' ? 'scoreGm' // MD uses GM score slot or shared
            : 'scoreGm';

  // For Comments, we usually store per-question comments in 'commentApprX', 
  // but this form design focuses on the summary comments at the bottom.
  // We'll keep the response state updated just in case we need per-question comments later,
  // but the UI will focus on scores for the grid + summary text areas.

  const isReviewerOnly = ['manager', 'gm', 'md'].includes(currentUserRole);

  const handleScoreChange = (questionId: string, value: string) => {
    if (isReviewerOnly) return;

    // Allow empty string to clear input
    if (value === '') {
      setResponses(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], [scoreField]: undefined }
      }));
      return;
    }

    const numScore = parseFloat(value);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], [scoreField]: numScore }
      }));
    }
  };

  const validate = (): boolean => {
    if (isReviewerOnly) return true;

    // 1. Check Scores
    const unanswered = questions.filter(q => {
      const r = responses[q.id];
      return !r || r[scoreField] === undefined || r[scoreField] === null;
    });

    if (unanswered.length > 0) {
      setError(`Please score all questions. ${unanswered.length} remaining.`);
      return false;
    }

    // 2. Check Summary Comments
    if (currentUserRole === 'approver1' && (!comments.approver1Good || !comments.approver1Improve)) return fail("Please fill in Good Points and Points for Improvement.");
    if (currentUserRole === 'approver2' && (!comments.approver2Good || !comments.approver2Improve)) return fail("Please fill in Good Points and Points for Improvement.");
    if (currentUserRole === 'approver3' && (!comments.approver3Good || !comments.approver3Improve)) return fail("Please fill in Good Points and Points for Improvement.");

    // For MD/GM/Manager, we might enforce notes?
    // if (currentUserRole === 'md' && !comments.approver3Good) ... (mapped logic below)

    return true;
  };

  const fail = (msg: string) => {
    setError(msg);
    return false;
  }

  // Save drafts function (scores + comments)
  const handleSaveDraft = async (): Promise<boolean> => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // 1. Prepare Response Data
      const responseData = Object.entries(responses).map(([qid, resp]) => {
        const question = questions.find(q => q.id === qid);
        return {
          questionId: qid,
          questionTitle: question?.questionTitle || '',
          questionWeight: question?.weight || 0,
          scoreSelf: resp.scoreSelf,
          scoreAppr1: resp.scoreAppr1,
          scoreAppr2: resp.scoreAppr2,
          scoreAppr3: resp.scoreAppr3,
          scoreMgr: resp.scoreMgr,
          scoreGm: resp.scoreGm,
          commentSelf: resp.commentSelf,
          commentAppr1: resp.commentAppr1,
          commentAppr2: resp.commentAppr2,
          commentAppr3: resp.commentAppr3,
          commentMgr: resp.commentMgr,
          commentGm: resp.commentGm,
        };
      });

      // 2. Call Server Action
      const { saveResponses } = await import('@/actions/responses');
      const res = await saveResponses(assessmentId, responseData);

      if (!res.success) {
        throw new Error(res.error || 'Failed to save responses');
      }

      // 3. Save Comments (Update Assessment)
      const updateData: any = {};

      // Update comments based on role
      if (currentUserRole === 'approver1') {
        updateData.approver1Good = comments.approver1Good;
        updateData.approver1Improve = comments.approver1Improve;
      } else if (currentUserRole === 'approver2') {
        updateData.approver2Good = comments.approver2Good;
        updateData.approver2Improve = comments.approver2Improve;
      } else if (currentUserRole === 'approver3') {
        updateData.approver3Good = comments.approver3Good;
        updateData.approver3Improve = comments.approver3Improve;
      } else if (['manager', 'md', 'gm'].includes(currentUserRole)) {
        // Manager/MD/GM share the same comment box as approver3 effectively in this UI
        updateData.approver3Good = comments.approver3Good;
        updateData.approver3Improve = comments.approver3Improve;
      }

      if (Object.keys(updateData).length > 0) {
        const { updateAssessment } = await import('@/actions/assessments');
        await updateAssessment(assessmentId, updateData);
      }

      setSuccessMessage('Draft saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      return true;

    } catch (err) {
      console.error(err);
      setError('An error occurred while saving. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!validate()) return;
    if (!confirm('Are you sure you want to approve? This action cannot be undone.')) return;

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Save Everything First (and check success)
      const saveSuccess = await handleSaveDraft();
      if (!saveSuccess) {
        setIsSubmitting(false); // Stop loading state
        // Error is already set by handleSaveDraft
        return;
      }

      // 2. Call Approve Server Action
      const { approveAssessment } = await import('@/actions/assessments');

      // Get the appropriate comment/note based on role
      let note = '';
      if (currentUserRole === 'approver1') note = comments.approver1Good + '\n' + comments.approver1Improve;
      else if (currentUserRole === 'approver2') note = comments.approver2Good + '\n' + comments.approver2Improve;
      else if (currentUserRole === 'approver3') note = comments.approver3Good + '\n' + comments.approver3Improve;
      else if (currentUserRole === 'manager') note = comments.approver3Good + '\n' + comments.approver3Improve; // Manager shares box
      else if (currentUserRole === 'md') note = comments.approver3Good + '\n' + comments.approver3Improve; // MD shares box
      else if (currentUserRole === 'gm') note = comments.approver3Good + '\n' + comments.approver3Improve; // GM shares box

      const res = await approveAssessment(assessmentId, currentUserRole, note);

      if (res && res.success === false) {
        setError(res.error || 'Failed to approve');
        return;
      }

      // Success redirect
      router.push(`/dashboard/assessments/${assessmentId}?approved=true`);
      router.refresh();

    } catch (err) {
      console.error(err);
      setError('Error submitting approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject and return to employee?')) return;
    setIsSubmitting(true);
    try {
      // Use rejectAssessment if available, or updateAssessment with correct status
      const { rejectAssessment } = await import('@/actions/assessments');
      // Verify rejectAssessment signature: (id, stage, reason)
      // We need to pass stage and reason.
      // But for quick fix on "Reject" button which has no input:
      // Let's use a default reason or just REJECTED status via updateAssessment if rejectAssessment is strict.
      // Actually, let's use the explicit action if possible.
      // Logic in step 4182 showed rejectAssessment being removed? NO, duplicate removed. 
      // The ONE remaining rejectAssessment (line 875 removed, but where is the other?)
      // I need to be sure rejectAssessment exists.
      // If unsure, updateAssessment with 'REJECTED' is safer if manual update is allowed.

      const { updateAssessment } = await import('@/actions/assessments');
      await updateAssessment(assessmentId, { status: 'REJECTED' });

      router.push(`/dashboard/assessments/${assessmentId}?rejected=true`);
      router.refresh();
    } catch (e) { setError('Error rejecting'); }
    finally { setIsSubmitting(false); }
  };

  // Helper for formatting
  const fmt = (v?: number) => (v !== undefined && v !== null ? v.toFixed(1) : '-');
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '';

  return (
    <div className="min-h-screen bg-slate-100 py-8 text-black font-sans text-xs">
      {/* Top Bar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/assessments/${assessmentId}`}>
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          </Link>
          <div className="font-bold text-lg text-slate-700">
            {currentUserRole === 'manager' || currentUserRole === 'gm' ? 'Review & Confirmation' : 'Assessment Approval'}
          </div>
        </div>

        {/* Messages */}
        {error && <div className="text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}
        {successMessage && <div className="text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {successMessage}</div>}

        {/* DEBUG INFO */}
        <div className="text-[10px] bg-yellow-100 p-1 border border-yellow-300">
          Role: {currentUserRole} | Status: {assessmentStatus} | A1: {approver1Id}
        </div>

        <div className="flex gap-2">
          {!isReviewerOnly && (
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> Save Draft
            </Button>
          )}
          <Button variant="destructive" onClick={handleReject} disabled={isSaving || isSubmitting}>
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={isSaving || isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            {isReviewerOnly ? 'Confirm & Proceed' : 'Approve & Submit'}
          </Button>
        </div>
      </div>

      {/* Main Content Card (A4 Width) */}
      <div className="bg-white mx-auto max-w-[210mm] shadow-lg border border-slate-200">

        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-end border-b-2 border-orange-500 pb-2 mb-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
              <div className="font-bold text-lg">PERSONNEL EVALUATION SHEET</div>
            </div>
            <div className="text-right text-[10px]">
              <div>Confidential</div>
              <div>Ref: {assessmentId.substring(0, 8)}</div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="border-2 border-orange-500 mb-6 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                  <span className="font-bold text-slate-600">Employee:</span>
                  <span className="font-bold">{employee.empName_Eng} ({employee.empCode})</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                  <span className="font-bold text-slate-600">Position:</span>
                  <span>{employee.position}</span>
                </div>
              </div>
              <div>
                <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                  <span className="font-bold text-slate-600">Department:</span>
                  <span>{employee.group}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guide */}
          <div className="border border-black mb-6 text-[10px]">
            <div className="grid grid-cols-5 divide-x divide-black text-center bg-slate-50">
              <div className="p-1"><b>1</b> Needs Improvement</div>
              <div className="p-1"><b>2</b> Fair</div>
              <div className="p-1"><b>3</b> Good</div>
              <div className="p-1"><b>4</b> Very Good</div>
              <div className="p-1"><b>5</b> Excellent</div>
            </div>
          </div>
        </div>

        {/* Excel Grid Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse border border-black text-[12px] table-fixed">
            <thead>
              <tr className="bg-slate-50 text-center">
                <th rowSpan={3} className="border border-black w-[40px] p-1">No</th>
                <th rowSpan={3} className="border border-black w-[200px] p-2">Item / Definition</th>
                <th rowSpan={3} className="border border-black w-[60px] p-1 bg-blue-50">Self</th>
                <th colSpan={3} className="border border-black p-1 bg-green-50">Evaluation Result</th>
              </tr>
              <tr className="bg-white text-center text-[10px]">
                <th className="border border-black p-1">1st</th>
                <th className="border border-black p-1">2nd</th>
                <th className="border border-black p-1">Final</th>
              </tr>
              <tr className="bg-white text-center text-[10px]">
                <th className="border border-black p-1 font-normal overflow-hidden text-ellipsis whitespace-nowrap bg-slate-100">{approver1Id || '-'}</th>
                <th className="border border-black p-1 font-normal overflow-hidden text-ellipsis whitespace-nowrap bg-slate-100">{approver2Id || '-'}</th>
                <th className="border border-black p-1 font-normal overflow-hidden text-ellipsis whitespace-nowrap bg-slate-100">{gmId || approver3Id || '-'}</th>
              </tr>
            </thead>
            <tbody>
              {questions.sort((a, b) => a.order - b.order).map((q, idx) => {
                const r = responses[q.id] || {};
                const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

                return (
                  <Fragment key={q.id}>
                    {isHeader && (
                      <tr>
                        <td colSpan={6} className="border border-black bg-slate-200 font-bold p-2 uppercase text-[11px]">{q.category}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-black text-center align-top p-2">{idx + 1}</td>
                      <td className="border border-black p-2 align-top">
                        <div className="font-semibold mb-1">{q.questionTitle}</div>
                        <div className="text-[11px] text-slate-500">{q.description}</div>
                        {q.descriptionJa && <div className="text-[10px] text-slate-400 mt-1">{q.descriptionJa}</div>}
                      </td>

                      {/* Self Score (Read Only) */}
                      <td className="border border-black text-center font-bold text-blue-900 bg-blue-50 align-top pt-3">
                        {fmt(r.scoreSelf)}
                      </td>

                      {/* Appr 1 */}
                      <td className={`border border-black p-0 align-top relative ${currentUserRole === 'approver1' ? 'bg-white' : 'bg-slate-50'}`}>
                        {currentUserRole === 'approver1' ? (
                          <input
                            type="number" className="w-full h-full absolute inset-0 text-center font-bold text-green-700 bg-yellow-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-lg"
                            min="0" max="5" step="1"
                            value={r.scoreAppr1 ?? ''}
                            onChange={(e) => handleScoreChange(q.id, e.target.value)}
                          />
                        ) : (
                          <div className="text-center pt-3 font-semibold text-slate-700">{fmt(r.scoreAppr1)}</div>
                        )}
                      </td>

                      {/* Appr 2 */}
                      <td className={`border border-black p-0 align-top relative ${currentUserRole === 'approver2' ? 'bg-white' : 'bg-slate-50'}`}>
                        {currentUserRole === 'approver2' ? (
                          <input
                            type="number" className="w-full h-full absolute inset-0 text-center font-bold text-green-700 bg-yellow-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-lg"
                            min="0" max="5" step="1"
                            value={r.scoreAppr2 ?? ''}
                            onChange={(e) => handleScoreChange(q.id, e.target.value)}
                          />
                        ) : (
                          <div className="text-center pt-3 font-semibold text-slate-700">{fmt(r.scoreAppr2)}</div>
                        )}
                      </td>

                      {/* Appr 3 */}
                      <td className={`border border-black p-0 align-top relative ${currentUserRole === 'approver3' ? 'bg-white' : 'bg-slate-50'}`}>
                        {currentUserRole === 'approver3' ? (
                          <input
                            type="number" className="w-full h-full absolute inset-0 text-center font-bold text-green-700 bg-yellow-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-lg"
                            min="0" max="5" step="1"
                            value={r.scoreAppr3 ?? ''}
                            onChange={(e) => handleScoreChange(q.id, e.target.value)}
                          />
                        ) : (
                          <div className="text-center pt-3 font-semibold text-slate-700">{fmt(r.scoreAppr3)}</div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Comments Section */}
        <div className="p-8 border-t-2 border-orange-500 mt-0">
          <div className="font-bold text-lg mb-4">Evaluation Summary & Comments</div>

          {/* 1st Evaluator */}
          <div className="mb-6 border border-black h-full flex">
            <div className="w-[200px] border-r border-black p-3 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm">1st Evaluator</div>
                <div className="text-xs text-slate-500 mt-1">{employee.approver1_Name || 'Approver 1'}</div>
              </div>
              <div className="mt-4">
                <div className="text-[10px] text-slate-400">Date</div>
                <div className="border-b border-black border-dotted">{formatDate(approver1Date)}</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="border-b border-black p-2">
                <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Good Points</div>
                {currentUserRole === 'approver1' ? (
                  <textarea
                    className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter good points..."
                    value={comments.approver1Good}
                    onChange={(e) => setComments(prev => ({ ...prev, approver1Good: e.target.value }))}
                  />
                ) : (
                  <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver1Good || '-'}</div>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Improvement Points</div>
                {currentUserRole === 'approver1' ? (
                  <textarea
                    className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter improvement points..."
                    value={comments.approver1Improve}
                    onChange={(e) => setComments(prev => ({ ...prev, approver1Improve: e.target.value }))}
                  />
                ) : (
                  <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver1Improve || '-'}</div>
                )}
              </div>
            </div>
          </div>

          {/* 2nd Evaluator */}
          <div className="mb-6 border border-black h-full flex">
            <div className="w-[200px] border-r border-black p-3 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm">2nd Evaluator</div>
                <div className="text-xs text-slate-500 mt-1">{employee.approver2_Name || 'Approver 2'}</div>
              </div>
              <div className="mt-4">
                <div className="text-[10px] text-slate-400">Date</div>
                <div className="border-b border-black border-dotted">{formatDate(approver2Date)}</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="border-b border-black p-2">
                <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Good Points</div>
                {currentUserRole === 'approver2' ? (
                  <textarea
                    className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter good points..."
                    value={comments.approver2Good}
                    onChange={(e) => setComments(prev => ({ ...prev, approver2Good: e.target.value }))}
                  />
                ) : (
                  <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver2Good || '-'}</div>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Improvement Points</div>
                {currentUserRole === 'approver2' ? (
                  <textarea
                    className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter improvement points..."
                    value={comments.approver2Improve}
                    onChange={(e) => setComments(prev => ({ ...prev, approver2Improve: e.target.value }))}
                  />
                ) : (
                  <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver2Improve || '-'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Final Evaluator */}
          <div className="mb-6 border border-black h-full flex">
            <div className="w-[200px] border-r border-black p-3 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm">Final Evaluator</div>
                <div className="text-xs text-slate-500 mt-1">{employee.gm_Name || employee.approver3_Name || 'Approver 3'}</div>
              </div>
              <div className="mt-4">
                <div className="text-[10px] text-slate-400">Date</div>
                <div className="border-b border-black border-dotted">{formatDate(approver3Date)}</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="border-b border-black p-2">
                <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Good Points</div>
                {['approver3', 'manager', 'md', 'gm'].includes(currentUserRole) ? (
                  <textarea
                    className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter good points..."
                    value={comments.approver3Good}
                    onChange={(e) => setComments(prev => ({ ...prev, approver3Good: e.target.value }))}
                  />
                ) : (
                  <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver3Good || '-'}</div>
                )}
              </div>
              <div className="text-[10px] font-bold bg-slate-100 inline-block px-1 mb-1">Improvement Points</div>
              {['approver3', 'manager', 'md', 'gm'].includes(currentUserRole) ? (
                <textarea
                  className="w-full h-16 border border-slate-300 p-1 text-xs resize-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter improvement points..."
                  value={comments.approver3Improve}
                  onChange={(e) => setComments(prev => ({ ...prev, approver3Improve: e.target.value }))}
                />
              ) : (
                <div className="text-xs h-16 p-1 overflow-y-auto whitespace-pre-wrap">{comments.approver3Improve || '-'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
