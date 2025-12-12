'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
    const unanswered = questions.filter(q => {
      const response = responses[q.id];
      return !response || response.scoreSelf === undefined || response.scoreSelf === null;
    });

    if (unanswered.length > 0) {
      setError(`Please score all questions. ${unanswered.length} question(s) remaining.`);
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
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
    if (!validateResponses()) {
      return;
    }

    if (!confirm('Are you sure you want to submit? You will not be able to edit after submission.')) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Save responses first
      const responseData = Object.values(responses).map(resp => ({
        assessmentId: assessment.id,
        questionId: resp.questionId,
        scoreSelf: resp.scoreSelf,
        commentSelf: resp.commentSelf || '',
      }));

      const saveResponse = await fetch('/api/assessment/save-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responseData }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save responses');
      }

      // Submit assessment
      const submitResponse = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: assessment.id }),
      });

      if (submitResponse.ok) {
        router.push(`/dashboard/assessments/${assessment.id}?submitted=true`);
        router.refresh();
      } else {
        setError('Failed to submit assessment');
      }
    } catch (err) {
      setError('An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Weight calculation removed
  // const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 0), 0);

  // Editable check
  // Employee can edit when status is Draft (admin) or Assigned/InProgress (user)
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
          {!isReadOnly && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || isSubmitting}>
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </>
          )}
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

        {/* Assessment Table */}
        <table className="w-full border-collapse border border-black text-[11px]">
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
              <tr><td colSpan={7} className="p-8 text-center border border-black italic">No questions configured.</td></tr>
            ) : (
              questions.sort((a, b) => a.order - b.order).map((q, idx) => {
                const response = responses[q.id] || {};
                const isHeader = idx === 0 || questions[idx - 1]?.category !== q.category;

                return (
                  <>
                    {isHeader && (
                      <tr key={`h-${q.category}`}>
                        <td colSpan={7} className="border border-black bg-slate-100 font-bold p-2 uppercase tracking-wide">
                          {q.category}
                        </td>
                      </tr>
                    )}
                    <tr key={q.id}>
                      <td className="border border-black text-center p-2 align-top">{idx + 1}</td>
                      <td className="border border-black p-2 align-top font-semibold">
                        {q.questionTitle}
                      </td>
                      <td className="border border-black p-2 align-top text-slate-600">
                        {q.description}
                      </td>

                      {/* Editable Self Score */}
                      <td className="border border-black p-2 align-top bg-blue-50">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="1" // Step 1 for integer scores as per image usually, but kept flexible
                          value={response.scoreSelf ?? ''}
                          onChange={(e) => handleScoreChange(q.id, e.target.value)}
                          disabled={isReadOnly}
                          className="w-full text-center p-1 border border-slate-300 rounded focus:border-blue-500 font-bold text-lg"
                        />
                      </td>

                      {/* Read Only Approver Scores */}
                      <td className="border border-black text-center p-2 align-top pt-3 text-slate-400">
                        {response.scoreAppr1 ?? '-'}
                      </td>
                      <td className="border border-black text-center p-2 align-top pt-3 text-slate-400 bg-slate-50">
                        {response.scoreAppr2 ?? '-'}
                      </td>
                      <td className="border border-black text-center p-2 align-top pt-3 text-slate-400 bg-slate-50">
                        {response.scoreAppr3 ?? '-'}
                      </td>
                    </tr>
                  </>
                );
              })
            )}
            {/* Total Row */}
            <tr className="bg-orange-100 font-bold border-t-2 border-black">
              <td colSpan={3} className="border border-black p-2 text-right">TOTAL</td>
              <td className="border border-black p-2 text-center bg-blue-100">
                {/* Calculate Self Total - Simple Average or Weighted? Usually Weighted Sum. 
                            If Question Weight is percent of total (e.g. 100), then:
                            Score * (Weight/100)? Or just Score avg? 
                            Usually it's (Sum(Score * Weight) / Sum(Weight)) if weights are absolute.
                            For now, let's leave blank or simple avg if requested. 
                            The original view left it blank. I will leave it blank to be safe.
                         */}
              </td>
              <td className="border border-black p-2 text-center"></td>
              <td className="border border-black p-2 text-center"></td>
              <td className="border border-black p-2 text-center"></td>
            </tr>
          </tbody>
        </table>

      </div>

      {/* Evaluation Summary & Signatures Section - Mimicking Page 2 / Bottom Section */}
      <div className="bg-white p-8 mx-auto max-w-[210mm] mt-8 shadow-lg text-xs text-black font-sans">
        <div className="border-b-2 border-orange-500 mb-4 font-bold text-lg">EVALUATION SUMMARY & COMMENTS</div>

        <div className="space-y-0 border-t border-l border-black">
          {[
            {
              title: "1st Evaluator",
              user: isDraft ? "Supervisor" : (employee.approver1_Name || '-'),
              code: employee.approver1_ID,
              date: assessment.approver1Date,
              goodPoints: "Good Points (ข้อดี)",
              improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)"
            },
            {
              title: "2nd Evaluator",
              user: isDraft ? "Manager" : (employee.approver2_Name || '-'),
              code: employee.approver2_ID,
              date: assessment.approver2Date,
              goodPoints: "Good Points (ข้อดี)",
              improvePoints: "Points for Improvement (จุดที่ต้องปรับปรุง)"
            },
            {
              title: "Final Evaluator",
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
                </div>

                {/* Bottom: Improvement Points */}
                <div className="flex-1 p-2 relative">
                  <div className="text-[10px] font-bold text-slate-700 bg-slate-50 inline-block px-1 rounded mb-1">
                    {evaluator.improvePoints}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
