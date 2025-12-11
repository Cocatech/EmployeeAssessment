'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
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
  questionId: string;
  scoreSelf?: number;
  commentSelf?: string;
}

interface Employee {
  empCode: string;
  empName_Eng: string;
  position: string;
  group: string;
  profileImage?: string | null;
}

interface ScoringPageProps {
  assessmentId: string;
  questions: Question[];
  existingResponses: any[];
  assessmentStatus: string;
  employee: Employee;
}

export default function ScoringForm({
  assessmentId,
  questions,
  existingResponses,
  assessmentStatus,
  employee
}: ScoringPageProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing responses
  useEffect(() => {
    const responseMap: Record<string, Response> = {};
    existingResponses.forEach(resp => {
      responseMap[resp.questionId] = {
        questionId: resp.questionId,
        scoreSelf: resp.scoreSelf,
        commentSelf: resp.commentSelf,
      };
    });
    setResponses(responseMap);
  }, [existingResponses]);

  const handleScoreChange = (questionId: string, score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 0 && numScore <= 5) {
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
    // Check if all questions have scores
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
        assessmentId,
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

    setIsSubmitting(true);
    setError('');

    try {
      // Save responses first
      const responseData = Object.values(responses).map(resp => ({
        assessmentId,
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
        body: JSON.stringify({ assessmentId }),
      });

      if (submitResponse.ok) {
        router.push(`/dashboard/assessments/${assessmentId}?submitted=true`);
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

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'text-gray-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateProgress = () => {
    const answered = questions.filter(q => {
      const response = responses[q.id];
      return response && response.scoreSelf !== undefined && response.scoreSelf !== null;
    }).length;
    return Math.round((answered / questions.length) * 100);
  };

  // Employee can edit when status is Draft (admin editing), Assigned (start assessment), or IN_PROGRESS
  const editableStatuses = ['DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'INPROGRESS'];
  const isReadOnly = !editableStatuses.includes(assessmentStatus.toUpperCase());

  return (
    <div className="space-y-6">
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
              <h1 className="text-2xl font-bold">Self Assessment</h1>
              <p className="text-sm text-muted-foreground">
                Rate yourself on each criteria (0-5 scale)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {calculateProgress()}% Complete ({Object.keys(responses).filter(k => responses[k].scoreSelf !== undefined).length} / {questions.length})
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

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          This assessment has been submitted and cannot be edited.
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

                  {/* Score Input */}
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
                          value={response.scoreSelf ?? ''}
                          onChange={(e) => handleScoreChange(question.id, e.target.value)}
                          disabled={isReadOnly}
                          className="w-24"
                          placeholder="0.0"
                        />
                        <span className="text-sm text-muted-foreground">/ 5.0</span>
                        {response.scoreSelf !== undefined && (
                          <span className={`text-lg font-bold ml-2 ${getScoreColor(response.scoreSelf)}`}>
                            {response.scoreSelf.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        0 = Poor, 1-2 = Below Average, 3 = Average, 4 = Good, 5 = Excellent
                      </p>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Your Comment (Optional)
                    </label>
                    <textarea
                      value={response.commentSelf ?? ''}
                      onChange={(e) => handleCommentChange(question.id, e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                      placeholder="Explain your rating, provide examples of your achievements..."
                    />
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      {/* Actions */}
      {!isReadOnly && (
        <Card className="p-6 sticky bottom-4 bg-background shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {calculateProgress() === 100 ? (
                <span className="text-green-600 font-medium">✓ All questions answered</span>
              ) : (
                <span>Complete all questions to submit</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || isSubmitting || calculateProgress() < 100}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
