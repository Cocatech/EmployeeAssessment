'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Save, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  questionTitle: string;
  description?: string;
  category: string;
  maxScore: number;
  order: number;
  titleTh?: string;
  titleJa?: string;
  descriptionTh?: string;
  descriptionJa?: string;
}

interface Response {
  questionId: string;
  scoreSelf?: number;
  commentSelf?: string;
  // Approver scores for display (optional)
  scoreAppr1?: number;
  scoreAppr2?: number;
  scoreAppr3?: number;
}

// Loosely typed to match data passed from server
interface ScoringPageProps {
  assessment: any;
  employee: any;
  questions: Question[];
  existingResponses: any[];
}

export default function ScoringForm({
  assessment,
  employee,
  questions,
  existingResponses
}: ScoringPageProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper to format dates
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // State for Approver Comments & Manager/HR Actions
  const [comments, setComments] = useState({
    approver1Good: assessment.approver1Good || '',
    approver1Improve: assessment.approver1Improve || '',
    approver2Good: assessment.approver2Good || '',
    approver2Improve: assessment.approver2Improve || '',
    approver3Good: assessment.approver3Good || '',
    approver3Improve: assessment.approver3Improve || '',
  });

  const [managerData, setManagerData] = useState({
    action: assessment.managerAction || '',
    reason: assessment.managerReason || '',
  });

  const [hrData, setHrData] = useState({
    status: assessment.hrStatus || '',
    note: assessment.hrNote || '',
  });

  const [gmData, setGmData] = useState({
    status: assessment.gmStatus || '',
    note: assessment.gmNote || '',
  });

  const [mdData, setMdData] = useState({
    status: assessment.mdStatus || '',
    note: assessment.mdNote || '',
  });

  const [showFeedbackConfirm, setShowFeedbackConfirm] = useState(false);
  const [feedbackDate, setFeedbackDate] = useState(assessment.feedbackDate || null);

  // Sync state with props (Fix for stale state on refresh)
  useEffect(() => {
    if (assessment.hrStatus) setHrData(prev => ({ ...prev, status: assessment.hrStatus || '' }));
    if (assessment.mdStatus) setMdData(prev => ({ ...prev, status: assessment.mdStatus || '' }));
  }, [assessment.hrStatus, assessment.mdStatus]);

  // Role Checks based on Status
  const isApprover1 = assessment.status === 'SUBMITTED_APPR1';
  const isApprover2 = assessment.status === 'SUBMITTED_APPR2';
  const isApprover3 = assessment.status === 'SUBMITTED_APPR3'; // Final Evaluator
  const isManager = assessment.status === 'SUBMITTED_MGR';
  const isHR = assessment.status === 'SUBMITTED_HR';
  const isMD = assessment.status === 'SUBMITTED_MD';
  const isFeedback = assessment.status === 'FEEDBACK_REQUIRED';
  const isGM = assessment.status === 'SUBMITTED_GM';

  // Check draft status
  const isDraft = assessment.status === 'DRAFT' || assessment.status === 'Draft';

  // Display helpers
  const displayName = isDraft ? 'TEMPLATE / DRAFT' : employee.empName_Eng;
  const displayEmpCode = isDraft ? 'N/A' : employee.empCode;
  const displayPosition = isDraft ? 'N/A' : employee.position;
  const displayGroup = isDraft ? 'N/A' : employee.group;
  const displayLevel = isDraft ? (assessment.targetLevel || 'See Target Level') : employee.assessmentLevel;
  const displayJoinDate = isDraft ? '-' : formatDate(employee.joinDate);
  const profileImage = !isDraft && employee.profileImage ? employee.profileImage : '/placeholder-user.jpg';

  // Load existing responses
  useEffect(() => {
    const responseMap: Record<string, Response> = {};
    existingResponses.forEach(resp => {
      responseMap[resp.questionId] = {
        questionId: resp.questionId,
        scoreSelf: resp.scoreSelf,
        commentSelf: resp.commentSelf,
        scoreAppr1: resp.scoreAppr1,
        scoreAppr2: resp.scoreAppr2,
        scoreAppr3: resp.scoreAppr3,
      };
    });
    setResponses(responseMap);
  }, [existingResponses]);

  const handleScoreChange = (questionId: string, value: string) => {
    // Allow empty string to clear input
    if (value === '') {
      setResponses(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          scoreSelf: undefined, // undefined implies incomplete
        }
      }));
      return;
    }

    const numScore = parseFloat(value);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          scoreSelf: numScore,
        }
      }));
    }
  };

  // Handler for Approver 1 score
  const handleAppr1ScoreChange = (questionId: string, value: string) => {
    if (value === '') {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr1: undefined } }));
      return;
    }
    const numScore = parseFloat(value);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr1: numScore } }));
    }
  };

  // Handler for Approver 2 score
  const handleAppr2ScoreChange = (questionId: string, value: string) => {
    if (value === '') {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr2: undefined } }));
      return;
    }
    const numScore = parseFloat(value);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr2: numScore } }));
    }
  };

  // Handler for Approver 3 score
  const handleAppr3ScoreChange = (questionId: string, value: string) => {
    if (value === '') {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr3: undefined } }));
      return;
    }
    const numScore = parseFloat(value);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({ ...prev, [questionId]: { ...prev[questionId], questionId, scoreAppr3: numScore } }));
    }
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        commentSelf: comment,
      }
    }));
  };

  const validateResponses = (): boolean => {
    // Determine which score field to validate based on current role
    const unanswered = questions.filter(q => {
      const response = responses[q.id];
      if (!response) return true;

      if (isApprover1) {
        return response.scoreAppr1 === undefined || response.scoreAppr1 === null;
      } else if (isApprover2) {
        return response.scoreAppr2 === undefined || response.scoreAppr2 === null;
      } else if (isApprover3) {
        return response.scoreAppr3 === undefined || response.scoreAppr3 === null;
      } else {
        // Self/Employee
        return response.scoreSelf === undefined || response.scoreSelf === null;
      }
    });

    if (unanswered.length > 0) {
      setError(`Please score all questions. ${unanswered.length} question(s) remaining.`);
      return false;
    }
    return true;
  };

  // Helper to save assessment fields (comments, manager actions)
  const saveAssessmentFields = async () => {
    // Determine what to save based on role/status
    const updateData: any = {};

    if (isApprover1) {
      updateData.approver1Good = comments.approver1Good;
      updateData.approver1Improve = comments.approver1Improve;
    }
    if (isApprover2) {
      updateData.approver2Good = comments.approver2Good;
      updateData.approver2Improve = comments.approver2Improve;
    }
    if (isApprover3) {
      updateData.approver3Good = comments.approver3Good;
      updateData.approver3Improve = comments.approver3Improve;
    }
    if (isManager) {
      updateData.managerAction = managerData.action;
      updateData.managerReason = managerData.reason;
    }
    if (isHR) {
      updateData.hrStatus = hrData.status;
      updateData.hrNote = hrData.note;
    }

    if (Object.keys(updateData).length > 0) {
      const { updateAssessment } = await import('@/actions/assessments');
      await updateAssessment(assessment.id, updateData);
    }
  };

  // Wrap original handlers to include field saving
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await saveAssessmentFields(); // Save comments/actions

      const responseData = Object.values(responses).map(resp => ({
        assessmentId: assessment.id,
        questionId: resp.questionId,
        scoreSelf: resp.scoreSelf,
        commentSelf: resp.commentSelf || '',
      }));

      const response = await fetch('/api/assessment/save-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responseData }),
      });

      if (response.ok) {
        setSuccessMessage('Draft saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to save draft');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };



  const handleSubmit = async () => {
    console.log('[DEBUG] handleSubmit called');

    if (!validateResponses()) return;

    // Validate Comments for Approvers
    if (isApprover1 && (!comments.approver1Good || !comments.approver1Improve)) {
      setError('Please fill in Good Points and Points for Improvement.');
      return;
    }
    if (isApprover2 && (!comments.approver2Good || !comments.approver2Improve)) {
      setError('Please fill in Good Points and Points for Improvement.');
      return;
    }
    if (isApprover3 && (!comments.approver3Good || !comments.approver3Improve)) {
      setError('Please fill in Good Points and Points for Improvement.');
      return;
    }
    // Validate Manager Action
    if (isManager) {
      if (!managerData.action) {
        setError('Please select an action.');
        return;
      }
      if ((managerData.action === 'DEMOTION' || managerData.action === 'TERMINATION') && !managerData.reason) {
        setError('Please provide a reason.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Determine Stage
      let stage: 'self' | 'approver1' | 'approver2' | 'approver3' | 'manager' | 'hr' | 'md' | 'gm' | 'feedback' = 'self';
      if (isApprover1) stage = 'approver1';
      else if (isApprover2) stage = 'approver2';
      else if (isApprover3) stage = 'approver3';
      else if (isManager) stage = 'manager';
      else if (isHR) stage = 'hr';
      else if (isMD) stage = 'md';
      else if (isGM) stage = 'gm';
      else if (isFeedback) stage = 'feedback';

      // Prepare Payload
      const payload = {
        assessmentId: assessment.id,
        responses: Object.values(responses).map(resp => ({
          questionId: resp.questionId,
          score: stage === 'self' ? resp.scoreSelf :
            stage === 'approver1' ? resp.scoreAppr1 :
              stage === 'approver2' ? resp.scoreAppr2 :
                stage === 'approver3' ? resp.scoreAppr3 : undefined,
          comment: stage === 'self' ? resp.commentSelf : undefined
        })),
        comments: {
          approver1Good: comments.approver1Good,
          approver1Improve: comments.approver1Improve,
          approver2Good: comments.approver2Good,
          approver2Improve: comments.approver2Improve,
          approver3Good: comments.approver3Good,
          approver3Improve: comments.approver3Improve,
        },
        managerData,
        hrData,
        stage: stage
      };

      // Call Server Action
      const { submitFullAssessment } = await import('@/actions/assessments');
      const result = await submitFullAssessment(payload);

      if (result.success) {
        router.push(`/dashboard/assessments/${assessment.id}?submitted=true`);
        router.refresh(); // Refresh to show updated status
      } else {
        setError(result.error || 'Failed to submit assessment');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Editable check
  const editableStatuses = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'INPROGRESS'];
  const isReadOnly = !editableStatuses.includes(assessment.status.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Action Bar */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/assessments/${assessment.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          {error && (
            <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 px-3 py-1 rounded border border-red-200">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="text-green-600 text-sm flex items-center gap-2 bg-green-50 px-3 py-1 rounded border border-green-200">
              ✓ {successMessage}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSubmitting}>
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </div>

      {/* Main Form Sheet */}
      <div className="bg-white p-8 mx-auto max-w-[210mm] shadow-lg text-xs text-black font-sans">

        {/* Header Row */}
        <div className="flex justify-between items-end border-b-2 border-orange-500 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-10 w-auto object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
            <div className="hidden font-bold text-lg text-slate-700">TOKYO RIKA</div>
          </div>
          <div className="font-bold text-lg">PERSONNEL EVALUATION SHEET</div>
          <div className="text-[10px] text-right">
            <div>Confidential</div>
            <div>Ref: {assessment.id.substring(0, 8)}</div>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="border-2 border-orange-500 mb-6">
          <div className="grid grid-cols-[1fr_120px] gap-0">
            {/* Info Fields */}
            <div className="grid grid-cols-4 border-r border-slate-300">
              {/* Row 1 */}
              <div className="bg-orange-100 p-2 border-b border-r border-slate-300 font-semibold flex items-center">Period</div>
              <div className="p-2 border-b border-r border-slate-300 col-span-3 flex items-center">
                {formatDate(assessment.periodStart)} - {formatDate(assessment.periodEnd)}
              </div>

              {/* Row 2 */}
              <div className="bg-orange-100 p-2 border-b border-r border-slate-300 font-semibold flex items-center">Emp ID</div>
              <div className="p-2 border-b border-r border-slate-300 flex items-center font-mono">{displayEmpCode}</div>
              <div className="bg-orange-100 p-2 border-b border-r border-slate-300 font-semibold flex items-center">Name</div>
              <div className="p-2 border-b border-slate-300 flex items-center font-bold px-2 text-sm">{displayName}</div>

              {/* Row 3 */}
              <div className="bg-orange-100 p-2 border-b border-r border-slate-300 font-semibold flex items-center">Department</div>
              <div className="p-2 border-b border-r border-slate-300 flex items-center">{displayGroup}</div>
              <div className="bg-orange-100 p-2 border-b border-r border-slate-300 font-semibold flex items-center">Position</div>
              <div className="p-2 border-b border-slate-300 flex items-center">{displayPosition}</div>

              {/* Row 4 */}
              <div className="bg-orange-100 p-2 border-r border-slate-300 font-semibold flex items-center">Level</div>
              <div className="p-2 border-r border-slate-300 flex items-center">{displayLevel}</div>
              <div className="bg-orange-100 p-2 border-r border-slate-300 font-semibold flex items-center">Join Date</div>
              <div className="p-2 border-slate-300 flex items-center">{displayJoinDate}</div>
            </div>

            {/* Photo Section */}
            <div className="flex items-center justify-center p-2 bg-slate-50">
              <div className="w-20 h-24 border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Rating Guide */}
        <div className="border border-black mb-6 text-[10px]">
          <div className="grid grid-cols-5 divide-x divide-black text-center bg-slate-50">
            <div className="p-2"><b className="block text-lg">1</b>Needs Improvement</div>
            <div className="p-2"><b className="block text-lg">2</b>Fair</div>
            <div className="p-2"><b className="block text-lg">3</b>Good</div>
            <div className="p-2"><b className="block text-lg">4</b>Very Good</div>
            <div className="p-2"><b className="block text-lg">5</b>Excellent</div>
          </div>
        </div>

        {/* Assessment Table: Hidden on Mobile, Block on Desktop & Print */}
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
                <tr><td colSpan={7} className="p-8 text-center border border-black italic">No questions configured.</td></tr>
              ) : (
                questions.sort((a, b) => a.order - b.order).map((q, idx) => {
                  const response = responses[q.id] || {};
                  const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

                  return (
                    <Fragment key={q.id}>
                      {isHeader && (
                        <tr key={`h-${q.category}`}>
                          <td colSpan={7} className="border border-black bg-slate-100 font-bold p-2 uppercase tracking-wide text-black">
                            {q.category}
                          </td>
                        </tr>
                      )}
                      <tr key={q.id}>
                        <td className="border border-black text-center p-2 align-top">{idx + 1}</td>
                        <td className="border border-black p-0 align-top font-tahoma bg-white font-normal text-black">
                          {q.titleJa && <div className="p-2 text-[10px] font-normal text-black flex items-center bg-gray-50/50 border-b border-gray-200">{q.titleJa}</div>}
                          <div className="p-2 min-h-[50px] flex items-center text-[12px]">{q.questionTitle}</div>
                        </td>
                        <td className="border border-black p-0 align-top text-black bg-white font-tahoma font-normal">
                          {q.descriptionJa && <div className="p-2 text-[10px] font-normal text-black flex items-center bg-gray-50/50 border-b border-gray-200">{q.descriptionJa}</div>}
                          <div className="p-2 min-h-[50px] flex items-center text-[12px]">{q.description}</div>
                        </td>

                        {/* Self Score - Editable only for Employee/Self */}
                        <td className="border border-black p-2 align-top bg-blue-50">
                          {!isApprover1 && !isApprover2 && !isApprover3 && !isManager && !isMD && !isGM ? (
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="1"
                              value={response.scoreSelf ?? ''}
                              onChange={(e) => handleScoreChange(q.id, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full text-center p-1 border border-slate-300 rounded focus:border-blue-500 font-bold text-lg text-black bg-white"
                            />
                          ) : (
                            <span className="font-bold text-lg block text-center">{response.scoreSelf ?? '-'}</span>
                          )}
                        </td>

                        {/* Approver 1 Score - Editable when status is SUBMITTED_APPR1 */}
                        <td className={`border border-black text-center p-2 align-top ${isApprover1 ? 'bg-green-50' : ''}`}>
                          {isApprover1 ? (
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="1"
                              value={response.scoreAppr1 ?? ''}
                              onChange={(e) => handleAppr1ScoreChange(q.id, e.target.value)}
                              className="w-full text-center p-1 border border-green-300 rounded focus:border-green-500 font-bold text-lg text-black bg-white"
                            />
                          ) : (
                            <span className="font-bold">{response.scoreAppr1 ?? '-'}</span>
                          )}
                        </td>

                        {/* Approver 2 Score - Editable when status is SUBMITTED_APPR2 */}
                        <td className={`border border-black text-center p-2 align-top ${isApprover2 ? 'bg-orange-50' : 'bg-slate-50'}`}>
                          {isApprover2 ? (
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="1"
                              value={response.scoreAppr2 ?? ''}
                              onChange={(e) => handleAppr2ScoreChange(q.id, e.target.value)}
                              className="w-full text-center p-1 border border-orange-300 rounded focus:border-orange-500 font-bold text-lg text-black bg-white"
                            />
                          ) : (
                            <span className="font-bold">{response.scoreAppr2 ?? '-'}</span>
                          )}
                        </td>

                        {/* Approver 3 Score - Editable when status is SUBMITTED_APPR3 */}
                        <td className={`border border-black text-center p-2 align-top ${isApprover3 ? 'bg-purple-50' : 'bg-slate-50'}`}>
                          {isApprover3 ? (
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="1"
                              value={response.scoreAppr3 ?? ''}
                              onChange={(e) => handleAppr3ScoreChange(q.id, e.target.value)}
                              className="w-full text-center p-1 border border-purple-300 rounded focus:border-purple-500 font-bold text-lg text-black bg-white"
                            />
                          ) : (
                            <span className="font-bold">{response.scoreAppr3 ?? '-'}</span>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })
              )}
              {/* Total Row */}
              <tr className="bg-orange-100 font-bold border-t-2 border-black">
                <td colSpan={3} className="border border-black p-2 text-right">TOTAL</td>
                <td className="border border-black p-2 text-center bg-blue-100">
                  {/* Total Self Score can be calculated here if needed */}
                </td>
                <td className="border border-black p-2 text-center"></td>
                <td className="border border-black p-2 text-center"></td>
                <td className="border border-black p-2 text-center"></td>
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
              const response = responses[q.id] || {};
              const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

              return (
                <Fragment key={`mobile-${q.id}`}>
                  {isHeader && (
                    <div className="font-bold text-lg text-slate-800 pt-4 pb-2 border-b border-orange-200">
                      {q.category}
                    </div>
                  )}
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {/* Card Header: # and Title */}
                    <div className="bg-slate-50 p-3 border-b border-slate-100 flex gap-3">
                      <div className="bg-orange-100 text-orange-800 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        {q.titleJa && <div className="text-xs text-slate-500 mb-1">{q.titleJa}</div>}
                        <div className="font-semibold text-sm text-slate-900">{q.questionTitle}</div>
                      </div>
                    </div>

                    {/* Card Body: Description */}
                    <div className="p-3 text-xs text-slate-600 border-b border-slate-100">
                      {q.descriptionJa && <div className="mb-2 text-slate-400">{q.descriptionJa}</div>}
                      <div>{q.description}</div>
                    </div>

                    {/* Card Footer: Inputs */}
                    <div className="p-3 flex items-center justify-between gap-4 bg-slate-50/50">
                      {/* Self Score Input area */}
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-blue-600 mb-1">Self Score</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="5"
                          value={response.scoreSelf ?? ''}
                          onChange={(e) => handleScoreChange(q.id, e.target.value)}
                          disabled={isReadOnly}
                          className="w-full text-center p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-bold text-xl bg-white text-blue-900 shadow-sm"
                          placeholder="-"
                        />
                      </div>

                      {/* Approver Scores Badges */}
                      <div className="flex gap-2">
                        <div className="text-center">
                          <div className="text-[9px] text-slate-400 mb-1">APP 1</div>
                          <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
                            {response.scoreAppr1 ?? '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-slate-400 mb-1">APP 2</div>
                          <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm">
                            {response.scoreAppr2 ?? '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-slate-400 mb-1">APP 3</div>
                          <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm">
                            {response.scoreAppr3 ?? '-'}
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

        {/* Evaluation Summary & Signatures Section */}
        <div className="bg-white p-8 mx-auto max-w-[210mm] mt-8 shadow-lg text-xs text-black font-sans">
          <div className="border-b-2 border-orange-500 mb-4 font-bold text-lg">上司コメント  คอมเม้นท์จากหัวหน้า</div>

          <div className="space-y-0 border-t border-l border-black">
            {[
              {
                title: "1st Evaluator",
                user: isDraft ? "Supervisor" : (employee.approver1_Name || '-'),
                code: employee.approver1_ID,
                date: assessment.approver1Date,
                goodPoints: "Good Points (ข้อดี)",
                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                canEdit: isApprover1,
                fieldGood: "approver1Good",
                fieldImprove: "approver1Improve",
                valueGood: comments.approver1Good,
                valueImprove: comments.approver1Improve
              },
              {
                title: "2nd Evaluator",
                user: isDraft ? "Manager" : (employee.approver2_Name || '-'),
                code: employee.approver2_ID,
                date: assessment.approver2Date,
                goodPoints: "Good Points (ข้อดี)",
                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                canEdit: isApprover2,
                fieldGood: "approver2Good",
                fieldImprove: "approver2Improve",
                valueGood: comments.approver2Good,
                valueImprove: comments.approver2Improve
              },
              {
                title: "Final Evaluator",
                user: isDraft ? "GM / MD" : (employee.gm_Name || employee.approver3_Name || '-'),
                code: employee.gm_ID || employee.approver3_ID,
                date: assessment.mdDate || assessment.approver3Date,
                goodPoints: "Good Points (ข้อดี)",
                improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)",
                canEdit: isApprover3,
                fieldGood: "approver3Good",
                fieldImprove: "approver3Improve",
                valueGood: comments.approver3Good,
                valueImprove: comments.approver3Improve
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

                {/* Right Column: Comments (With Input Logic) */}
                <div className="flex-1 flex flex-col">
                  {/* Good Points */}
                  <div className="flex-1 border-b border-black p-2 bg-white">
                    <div className="font-bold mb-1 text-[10px]">{evaluator.goodPoints}</div>

                    {evaluator.canEdit ? (
                      <textarea
                        className="w-full h-[60px] border border-slate-300 p-1 text-[11px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Enter good points here..."
                        value={evaluator.valueGood}
                        onChange={(e) => {
                          const val = e.target.value;
                          setComments(prev => ({ ...prev, [evaluator.fieldGood]: val }));
                        }}
                      />
                    ) : (
                      <div className="text-[11px] whitespace-pre-wrap">{evaluator.valueGood || '-'}</div>
                    )}
                  </div>

                  {/* Improvement Points */}
                  <div className="flex-1 p-2 bg-white">
                    <div className="font-bold mb-1 text-[10px]">{evaluator.improvePoints}</div>

                    {evaluator.canEdit ? (
                      <textarea
                        className="w-full h-[60px] border border-slate-300 p-1 text-[11px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="Enter improvement points here..."
                        value={evaluator.valueImprove}
                        onChange={(e) => {
                          const val = e.target.value;
                          setComments(prev => ({ ...prev, [evaluator.fieldImprove]: val }));
                        }}
                      />
                    ) : (
                      <div className="text-[11px] whitespace-pre-wrap">{evaluator.valueImprove || '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Manager Action Section */}
          {(isManager || assessment.managerAction) && (
            <div className="mt-6 border-2 border-slate-800 p-4 bg-slate-50">
              <h3 className="font-bold text-sm mb-4 border-b border-slate-300 pb-2">Applied by Manager (Promotion/Action)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: No Change */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="managerAction"
                    value="NO_CHANGE"
                    checked={managerData.action === 'NO_CHANGE'}
                    onChange={(e) => setManagerData(prev => ({ ...prev, action: e.target.value }))}
                    disabled={!isManager}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold">No Change (昇格・降格なし)</div>
                    <div className="text-xs text-slate-500">Maintain current position and grade.</div>
                  </div>
                </label>

                {/* Option 2: Promotion */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="managerAction"
                    value="PROMOTION"
                    checked={managerData.action === 'PROMOTION'}
                    onChange={(e) => setManagerData(prev => ({ ...prev, action: e.target.value }))}
                    disabled={!isManager}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-green-700">Promotion (昇格 - Recommendation)</div>
                    <div className="text-xs text-slate-500">Recommend for promotion.</div>
                  </div>
                </label>

                {/* Option 3: Demotion */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="managerAction"
                      value="DEMOTION"
                      checked={managerData.action === 'DEMOTION'}
                      onChange={(e) => setManagerData(prev => ({ ...prev, action: e.target.value }))}
                      disabled={!isManager}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-red-700">Demotion (降格)</div>
                      <div className="text-xs text-slate-500 mb-1">Reason (Required):</div>
                      <textarea
                        className="w-full border border-slate-300 p-1 text-xs"
                        disabled={!isManager || managerData.action !== 'DEMOTION'}
                        value={managerData.action === 'DEMOTION' ? managerData.reason : ''}
                        onChange={(e) => setManagerData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Specify reason..."
                      />
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="managerAction"
                      value="TERMINATION"
                      checked={managerData.action === 'TERMINATION'}
                      onChange={(e) => setManagerData(prev => ({ ...prev, action: e.target.value }))}
                      disabled={!isManager}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-red-900">Termination (解雇)</div>
                      <div className="text-xs text-slate-500 mb-1">Reason (Required):</div>
                      <textarea
                        className="w-full border border-slate-300 p-1 text-xs"
                        disabled={!isManager || managerData.action !== 'TERMINATION'}
                        value={managerData.action === 'TERMINATION' ? managerData.reason : ''}
                        onChange={(e) => setManagerData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Specify reason..."
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Signature Area for Manager */}
              <div className="mt-4 flex justify-end">
                <div className="text-center w-[150px]">
                  <div className="border-b border-black h-8 mb-1"></div>
                  <div className="text-[10px]">Manager Signature</div>
                </div>
              </div>
            </div>
          )}

          {/* HR & MD Section (Summary & Approval) */}
          {(assessment.status === 'SUBMITTED_HR' || assessment.status === 'SUBMITTED_MD' || assessment.status === 'COMPLETED') && (
            <div className="mt-6 flex flex-col md:flex-row gap-4">
              {/* HR Section */}
              <div className="flex-1 border-2 border-black p-2">
                <div className="font-bold mb-2 text-center bg-slate-100 p-1">
                  Summary and Record (HR)
                  <span className="text-[10px] text-red-500 ml-2 block">(Debug: St="{assessment.hrStatus || 'null'}" Dt={assessment.hrDate ? 'Yes' : 'No'})</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={hrData.status === 'Approved' || !!assessment.hrDate} disabled={!isHR} onChange={() => isHR && setHrData(prev => ({ ...prev, status: 'Approved' }))} />
                    <span>Verified / Checked (อนุมัติ / ตรวจสอบแล้ว)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={hrData.status === 'Rejected'} disabled={!isHR} onChange={() => isHR && setHrData(prev => ({ ...prev, status: 'Rejected' }))} />
                    <span>Rejected (ไม่อนุมัติ)</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold">HR Note:</div>
                    <textarea
                      className="w-full h-[40px] border border-slate-300 text-xs p-1"
                      disabled={!isHR}
                      value={hrData.note}
                      onChange={(e) => setHrData(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <div className="border-b border-black h-8"></div>
                    <div className="text-[10px]">HR Signature</div>
                  </div>
                </div>
              </div>

              {/* MD Section */}
              <div className="flex-1 border-2 border-black p-2">
                <div className="font-bold mb-2 text-center bg-slate-100 p-1">
                  Approved by MD
                  <span className="text-[10px] text-red-500 ml-2 block">(Debug: St="{assessment.mdStatus || 'null'}" Dt={assessment.mdDate ? 'Yes' : 'No'})</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mdData.status === 'Approved' || assessment.status === 'COMPLETED' || !!assessment.mdDate}
                      disabled={!isMD}
                      onChange={() => isMD && setMdData(prev => ({ ...prev, status: 'Approved' }))}
                    />
                    <span>Approved (อนุมัติ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mdData.status === 'Rejected'}
                      disabled={!isMD}
                      onChange={() => isMD && setMdData(prev => ({ ...prev, status: 'Rejected' }))}
                    />
                    <span>Rejected (ไม่อนุมัติ)</span>
                  </div>

                  <div className="mt-12 text-center">
                    <div className="border-b border-black h-8 text-right pr-2 italic text-[10px]">
                      {assessment.mdDate ? formatDate(assessment.mdDate) : ''}
                    </div>
                    <div className="text-[10px]">MD Signature</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & GM Section */}
          {(assessment.status === 'FEEDBACK_REQUIRED' || assessment.status === 'SUBMITTED_GM' || assessment.status === 'COMPLETED') && (
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              {/* Feedback Section */}
              <div className="flex-1 border-2 border-black p-2">
                <div className="font-bold mb-2 text-center bg-slate-100 p-1">Feedback Session (Manager)</div>
                <div className="flex flex-col items-center justify-center h-full min-h-[100px] gap-4">
                  <div className="text-sm">
                    Has the feedback interview been conducted?
                  </div>
                  {assessment.feedbackDate ? (
                    <div className="text-green-600 font-bold">
                      Confirmed on {formatDate(assessment.feedbackDate)}
                    </div>
                  ) : (
                    <Button
                      disabled={!isFeedback}
                      onClick={() => setShowFeedbackConfirm(true)}
                      className="bg-blue-600 text-white"
                    >
                      Confirm Feedback Given
                    </Button>
                  )}
                </div>
              </div>

              {/* GM Section */}
              <div className="flex-1 border-2 border-black p-2">
                <div className="font-bold mb-2 text-center bg-slate-100 p-1">Confirmed by GM</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={assessment.status === 'COMPLETED' || assessment.gmDate} disabled />
                    <span>Acknowledged / Approved</span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold">GM Note:</div>
                    <textarea
                      className="w-full h-[40px] border border-slate-300 text-xs p-1"
                      disabled={!isGM}
                      value={gmData.note}
                      onChange={(e) => setGmData(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>

                  {isGM && !assessment.gmDate && (
                    <Button
                      className="w-full mt-2 bg-green-600 text-white h-8 text-xs"
                      disabled={isSaving}
                      onClick={async () => {
                        try {
                          setIsSaving(true);
                          // First save note if needed (omitted for brevity, ideally save before approve)

                          const res = await fetch('/api/assessment/approve', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assessmentId: assessment.id, action: 'approve' }),
                          });

                          if (res.ok) {
                            router.refresh();
                            window.location.reload();
                          }
                        } catch (e) { alert('Error'); } finally { setIsSaving(false); }
                      }}
                    >
                      Confirm & Complete
                    </Button>
                  )}

                  <div className="mt-4 text-center">
                    <div className="border-b border-black h-8 text-right pr-2 italic text-[10px]">
                      {assessment.gmDate ? formatDate(assessment.gmDate) : ''}
                    </div>
                    <div className="text-[10px]">GM Signature</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <Dialog open={showFeedbackConfirm} onOpenChange={setShowFeedbackConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Feedback Session</DialogTitle>
            <DialogDescription>
              Please confirm that you have conducted the feedback interview with the employee. (Status: {assessment.status})
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsSaving(true);
                  const res = await fetch('/api/assessment/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assessmentId: assessment.id, action: 'approve' }),
                  });

                  if (!res.ok) throw new Error('Failed');

                  router.refresh();
                  window.location.reload();
                } catch (error) {
                  console.error(error);
                  alert('Failed to confirm feedback');
                  setIsSaving(false);
                  setShowFeedbackConfirm(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
