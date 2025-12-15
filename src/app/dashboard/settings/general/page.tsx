import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { getSystemSettings } from '@/actions/settings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Grip } from 'lucide-react';

export const metadata = {
    title: 'General Settings | TRTH Assessment',
};

export default async function GeneralSettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/signin');
    if (!await isSystemAdmin()) redirect('/dashboard');

    const settings = await getSystemSettings();

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Grip className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">General / Branding Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure system logos and general preferences
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/settings">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Settings
                    </Button>
                </Link>
            </div>

            <GeneralSettings initialSettings={settings} />
        </div>
    );
}
