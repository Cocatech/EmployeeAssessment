import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Search, Filter } from 'lucide-react';
import { getAuditLogs } from '@/actions/audit';
import { PaginationControl } from '@/components/ui/pagination-control';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


export const metadata = {
    title: 'Audit Logs | TRTH Assessment',
    description: 'System security and activity logs',
};

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams: { q?: string; action?: string; page?: string };
}) {
    const session = await auth();
    if (!session?.user) redirect('/auth/signin');

    // Verify SYSADMIN access
    if (!await isSystemAdmin()) {
        redirect('/dashboard');
    }

    const query = searchParams.q || '';
    const page = Number(searchParams.page) || 1;
    const limit = 20;

    const { data: logs, metadata } = await getAuditLogs({
        search: query,
        page,
        limit
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Audit Logs</h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor system activities and security events
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle>System Activity</CardTitle>
                        <div className="flex gap-2">
                            <form className="flex gap-2">
                                <Input
                                    name="q"
                                    placeholder="Search User, ID..."
                                    className="w-[250px]"
                                    defaultValue={query}
                                />
                                <Button type="submit" variant="secondary" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[120px]">Actor</TableHead>
                                    <TableHead className="w-[150px]">Action</TableHead>
                                    <TableHead className="w-[120px]">Target Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap font-mono text-xs">
                                                {new Date(log.createdAt).toLocaleString('th-TH', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.userId}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={log.userEmail}>
                                                        {log.userEmail}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    log.action.includes('SECURITY') ? 'border-red-500 text-red-500' :
                                                        log.action.includes('REVOKE') ? 'border-orange-500 text-orange-500' :
                                                            log.action.includes('GRANT') ? 'border-green-500 text-green-500' :
                                                                'border-slate-500'
                                                }>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <span className="font-semibold">{log.entity}</span>
                                                <div className="text-xs text-muted-foreground font-mono">{log.entityId}</div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground max-w-[400px] truncate">
                                                {log.changes || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            <PaginationControl
                currentPage={metadata.page}
                totalPages={metadata.totalPages}
                baseUrl="/dashboard/audit"
                searchParams={{ q: query }}
            />
        </div>
    );
}
