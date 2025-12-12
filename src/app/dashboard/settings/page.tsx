import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, Briefcase, Building, Users, ArrowLeft, ClipboardCheck } from 'lucide-react';

export const metadata = {
  title: 'Settings | TRTH Assessment',
  description: 'System settings and master data management',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Only System Admin can access settings
  if (!await isSystemAdmin()) {
    redirect('/dashboard');
  }

  const settingsCards = [
    {
      title: 'Positions',
      description: 'Manage employee positions and job titles',
      icon: Briefcase,
      href: '/dashboard/settings/positions',
      color: 'bg-blue-500',
    },
    {
      title: 'Groups',
      description: 'Manage organizational groups and departments',
      icon: Building,
      href: '/dashboard/settings/groups',
      color: 'bg-green-500',
    },
    {
      title: 'Teams',
      description: 'Manage teams within groups',
      icon: Users,
      href: '/dashboard/settings/teams',
      color: 'bg-purple-500',
    },
    {
      title: 'Assessment Types',
      description: 'Manage assessment period types (Annual, Mid-year, etc.)',
      icon: Settings,
      href: '/dashboard/settings/assessment-types',
      color: 'bg-orange-500',
    },
    {
      title: 'Assessment Questions',
      description: 'Manage assessment templates and criteria',
      icon: ClipboardCheck,
      href: '/dashboard/settings/assessment-questions',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage master data and system configuration
            </p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((setting) => {
          const Icon = setting.icon;
          return (
            <Link key={setting.href} href={setting.href}>
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${setting.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {setting.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Settings</h3>
            <p className="text-sm text-blue-800">
              Master data configuration for the assessment system. Changes here will affect employee records,
              forms, and reports throughout the system. Only System Administrators can access these settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
