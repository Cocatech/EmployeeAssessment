'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: string;
  questionTitle: string;
  description?: string;
  category: string;
  weight: number;
  maxScore: number;
  order: number;
}

interface Response {
  id: string;
  questionId: string;
  scoreSelf?: number;
  scoreAppr1?: number; // Approver 1
  scoreAppr2?: number; // Approver 2
  scoreAppr3?: number; // Approver 3
  scoreMgr?: number;   // Manager (New)
  scoreGm?: number;    // GM
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
}

interface ApprovalFormProps {
  assessmentId: string;
  assessmentStatus: string;
  employee: Employee;
  questions: Question[];
  responses: Response[];
  currentUserRole: 'approver1' | 'approver2' | 'approver3' | 'manager' | 'gm';
  approver1Id?: string | null;
  approver2Id?: string | null;
  approver3Id?: string | null;
  managerId?: string | null;
  gmId?: string | null;
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
  gmId
}: ApprovalFormProps) {
  const router = useRouter();

  // Initialize responses with auto-fill logic for shared approvers
  const [responses, setResponses] = useState<Record<string, Partial<Response>>>(() => {
    const initialMap: Record<string, Partial<Response>> = {};

    initialResponses.forEach(r => {
      const val = { ...r };

      // Auto-fill logic: If current approver is same as a previous one, copy the score
      if (currentUserRole === 'approver2') {
        if (approver2Id === approver1Id && val.scoreAppr2 === undefined) {
          val.scoreAppr2 = val.scoreAppr1;
          val.commentAppr2 = val.commentAppr1;
        }
      } else if (currentUserRole === 'approver3') {
        if (approver3Id === approver2Id && val.scoreAppr3 === undefined) {
          val.scoreAppr3 = val.scoreAppr2;
          val.commentAppr3 = val.commentAppr2;
        } else if (approver3Id === approver1Id && val.scoreAppr3 === undefined) {
          val.scoreAppr3 = val.scoreAppr1;
          val.commentAppr3 = val.commentAppr1;
        }
      } else if (currentUserRole === 'manager') {
        // Manager is reviewer only - DO NOT copy scores
      } else if (currentUserRole === 'gm') {
        // GM is reviewer only - DO NOT copy scores
      }

      initialMap[r.questionId] = val;
    });

    return initialMap;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Determine current field based on role
  // Note: Database field mapping
  // approver1 -> scoreAppr1
  // approver2 -> scoreAppr2
  // approver3 -> scoreAppr3
  // manager -> scoreMgr
  // gm -> scoreGm
  const scoreField = currentUserRole === 'approver1' ? 'scoreAppr1'
    : currentUserRole === 'approver2' ? 'scoreAppr2'
      : currentUserRole === 'approver3' ? 'scoreAppr3'
        : currentUserRole === 'manager' ? 'scoreMgr'
          : 'scoreGm';

  const commentField = currentUserRole === 'approver1' ? 'commentAppr1'
    : currentUserRole === 'approver2' ? 'commentAppr2'
      : currentUserRole === 'approver3' ? 'commentAppr3'
        : currentUserRole === 'manager' ? 'commentMgr'
          : 'commentGm';

  const roleLabel = currentUserRole === 'approver1' ? 'Approver 1'
    : currentUserRole === 'approver2' ? 'Approver 2'
      : currentUserRole === 'approver3' ? 'Approver 3'
        : currentUserRole === 'manager' ? 'Manager'
          : 'MD';

  const handleScoreChange = (questionId: string, score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 0 && numScore <= 5) {
      setResponses(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [scoreField]: numScore,
        }
      }));
    }
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [commentField]: comment,
      }
    }));
  };

  const validateResponses = (): boolean => {
    // Managers and GMs are reviewers only, validation skipped for scores
    if (['manager', 'gm'].includes(currentUserRole)) {
      return true;
    }

    const unanswered = questions.filter(q => {
      const response = responses[q.id];
      return !response || response[scoreField] === undefined || response[scoreField] === null;
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
      const responseData = Object.entries(responses).map(([questionId, resp]) => ({
        id: resp.id,
        assessmentId,
        questionId,
        [scoreField]: resp[scoreField],
        [commentField]: resp[commentField] || '',
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

  const handleApprove = async () => {
    if (!validateResponses()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Save responses first
      const responseData = Object.entries(responses).map(([questionId, resp]) => ({
        id: resp.id,
        assessmentId,
        questionId,
        [scoreField]: resp[scoreField],
        [commentField]: resp[commentField] || '',
      }));

      const saveResponse = await fetch('/api/assessment/save-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responseData }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save responses');
      }

      // 2. Call Approve API (Server determines next status)
      const approveResponse = await fetch('/api/assessment/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          action: 'approve',
        }),
      });

      if (approveResponse.ok) {
        router.push(`/dashboard/assessments/${assessmentId}?approved=true`);
        router.refresh();
      } else {
        setError('Failed to approve assessment');
      }
    } catch (err) {
      setError('An error occurred while approving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this assessment? This will send it back to the employee.')) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const rejectResponse = await fetch('/api/assessment/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          action: 'reject'
        }),
      });

      if (rejectResponse.ok) {
        router.push(`/dashboard/assessments/${assessmentId}?rejected=true`);
        router.refresh();
      } else {
        setError('Failed to reject assessment');
      }
    } catch (err) {
      setError('An error occurred while rejecting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-gray-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateProgress = () => {
    // Managers and GMs are reviewers only, progress always 100%
    if (['manager', 'gm'].includes(currentUserRole)) {
      return 100;
    }

    const answered = questions.filter(q => {
      const response = responses[q.id];
      return response && response[scoreField] !== undefined && response[scoreField] !== null;
    }).length;
    return Math.round((answered / questions.length) * 100);
  };

  // Helper to render score block with cleaner code
  const renderScoreBlock = (
    title: string,
    score?: number,
    comment?: string,
    bgColor: string = "bg-gray-50",
    borderColor: string = "border-gray-200",
    textColor: string = "text-gray-900",
    scoreFieldKey?: keyof Response
  ) => (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <h4 className={`text-sm font-semibold mb-2 ${textColor}`}>{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`text-sm font-medium mb-1 block ${textColor}`}>Score</label>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score !== undefined && score !== null ? score.toFixed(1) : 'N/A'}
            </span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
        </div>
        <div>
          <label className={`text-sm font-medium mb-1 block ${textColor}`}>Comment</label>
          <p className="text-sm text-gray-700">
            {comment || 'No comment provided'}
          </p>
        </div>
      </div>
    </div>
  );

  const isReviewerOnly = ['manager', 'gm'].includes(currentUserRole);

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/assessments/${assessmentId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {employee.profileImage ? (
              <div className="h-12 w-12 rounded-full overflow-hidden border">
                <img src={employee.profileImage} alt="Employee" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                {employee.empName_Eng.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{roleLabel} Review</h1>
              <p className="text-sm text-muted-foreground">
                {employee.empCode} - {employee.empName_Eng} ({employee.position})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Review Progress</span>
          <span className="text-sm text-muted-foreground">
            {calculateProgress()}% Complete ({Object.values(responses).filter(r => r[scoreField] !== undefined).length} / {questions.length})
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((question, index) => {
            const response = responses[question.id] || {};

            return (
              <Card key={question.id} className="p-6">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Question {index + 1}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            {question.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Weight: {question.weight}%
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mt-1">
                          {question.questionTitle}
                        </h3>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1. Self Assessment (Always Visible) */}
                  {renderScoreBlock("Employee's Self Assessment", response.scoreSelf, response.commentSelf, "bg-blue-50", "border-blue-200", "text-blue-900")}

                  {/* 2. Approver 1 (Visible to Appr2, Appr3, Mgr, GM) */}
                  {currentUserRole !== 'approver1' && response.scoreAppr1 !== undefined && (
                    renderScoreBlock("Approver 1's Review", response.scoreAppr1, response.commentAppr1, "bg-green-50", "border-green-200", "text-green-900")
                  )}

                  {/* 3. Approver 2 (Visible to Appr3, Mgr, GM) */}
                  {['approver3', 'manager', 'gm'].includes(currentUserRole) && response.scoreAppr2 !== undefined && (
                    renderScoreBlock("Approver 2's Review", response.scoreAppr2, response.commentAppr2, "bg-yellow-50", "border-yellow-200", "text-yellow-900")
                  )}





                  {/* Your Score Input (Current User) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 ring-2 ring-primary/20">
                    <h4 className="text-sm font-semibold mb-3 text-slate-900">Your {roleLabel} Review</h4>

                    {!isReviewerOnly && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Score (0-5) <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              value={response[scoreField] ?? ''}
                              onChange={(e) => handleScoreChange(question.id, e.target.value)}
                              className="w-24 font-bold"
                              placeholder="0.0"
                            />
                            <span className="text-sm text-muted-foreground">/ 5.0</span>
                            {response[scoreField] !== undefined && response[scoreField] !== null && (
                              <span className={`text-lg font-bold ml-2 ${getScoreColor(response[scoreField])}`}>
                                {response[scoreField]!.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isReviewerOnly && (
                      <div className="mb-3 p-3 bg-blue-50 text-blue-700 rounded text-sm">
                        <span className="font-semibold">Reviewer Mode:</span> You are reviewing scores from prior approvers. No score input required.
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="text-sm font-medium mb-2 block">
                        Your Feedback (Optional)
                      </label>
                      <textarea
                        value={response[commentField] ?? ''}
                        onChange={(e) => handleCommentChange(question.id, e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                        placeholder={`Provide feedback as ${roleLabel}...`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      {/* Actions */}
      <Card className="p-6 sticky bottom-4 bg-background shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {calculateProgress() === 100 ? (
              <span className="text-green-600 font-medium">✓ All questions reviewed</span>
            ) : (
              <span>Complete all questions to approve</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isSaving || isSubmitting}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSaving || isSubmitting || (!isReviewerOnly && calculateProgress() < 100)}
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
