import { AssessmentCreationForm } from '@/components/assessment/AssessmentCreationForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAssessmentTypes } from '@/actions/settings';
import { getAssessmentLevels } from '@/actions/levels';

/* ... imports ... */

export default async function NewAssessmentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const currentUser = session.user as any;
  const empCode = currentUser?.empCode || 'ADMIN';

  // Fetch assessment types and levels from database
  const [assessmentTypes, levels] = await Promise.all([
    getAssessmentTypes(),
    getAssessmentLevels()
  ]);

  return (
    <div className="space-y-6">
      {/* ... header ... */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/assessments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create New Assessment</h1>
        <p className="text-gray-600 mt-1">
          Create assessment template and assign to employees by level
        </p>
      </div>

      <AssessmentCreationForm
        assessorId={empCode}
        assessmentTypes={assessmentTypes}
        levels={levels}
      />
    </div>
  );
}
