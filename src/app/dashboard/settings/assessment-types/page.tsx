import { getAssessmentTypes } from '@/actions/settings';
import { AssessmentTypeManager } from '@/components/settings/AssessmentTypeManager';

export const metadata = {
  title: 'Assessment Types - Settings',
  description: 'Manage assessment period types',
};

export default async function AssessmentTypesPage() {
  const assessmentTypes = await getAssessmentTypes();

  return (
    <div className="container mx-auto py-6">
      <AssessmentTypeManager assessmentTypes={assessmentTypes} />
    </div>
  );
}
