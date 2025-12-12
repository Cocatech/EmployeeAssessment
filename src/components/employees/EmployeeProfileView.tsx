import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    Calendar,
    Briefcase,
    Building,
    Users,
    User,
    ShieldCheck,
    Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EmployeeProfileViewProps {
    employee: any;
    backUrl: string;
    editUrl: string;
}

export function EmployeeProfileView({ employee, backUrl, editUrl }: EmployeeProfileViewProps) {
    // Helpers
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getStatusColor = (isActive: boolean) => isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';

    // Dynamic Approver List Construction
    const reportingLine = [
        { label: 'Direct Manager (Approver 1)', code: employee.approver1_ID, name: employee.approver1_Name },
        { label: 'Approver 2', code: employee.approver2_ID, name: employee.approver2_Name },
        { label: 'Approver 3', code: employee.approver3_ID, name: employee.approver3_Name },
        { label: 'General Manager', code: employee.gm_ID, name: employee.gm_Name },
    ].filter(item => item.code && item.code.trim() !== ''); // Only show assigned slots

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in duration-300">

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Link href={backUrl} className="group">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Button>
                </Link>
            </div>

            {/* Main Profile Header - Clean & Minimal */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">

                {/* Avatar Area */}
                <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden border border-slate-100 bg-slate-50 relative">
                        {employee.profileImage ? (
                            <Image
                                src={employee.profileImage}
                                alt={employee.empName_Eng}
                                width={128}
                                height={128}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Area */}
                <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-slate-900">{employee.empName_Eng}</h1>
                                <Badge variant="secondary" className={`font-normal ${getStatusColor(employee.isActive)}`}>
                                    {employee.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            {employee.empName_Thai && (
                                <p className="text-lg text-slate-500 font-medium">{employee.empName_Thai}</p>
                            )}
                        </div>

                        <Link href={editUrl}>
                            <Button variant="outline" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        </Link>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div>
                            <span className="text-slate-500 block mb-1">Employee Code</span>
                            <span className="font-mono font-medium text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                {employee.empCode}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-1">Position</span>
                            <span className="font-medium text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                {employee.position}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-1">Department / Group</span>
                            <span className="font-medium text-slate-900 flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                {employee.group}
                                {employee.team && <span className="text-slate-400">/ {employee.team}</span>}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block mb-1">Employee Type</span>
                            <span className="font-medium text-slate-900">{employee.employeeType}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Contact & Personal */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-50">
                            <CardTitle className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                <User className="w-4 h-4" /> Contact Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4 text-sm">
                            <div>
                                <label className="text-slate-500 text-xs block mb-1">Email Address</label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    {employee.email ? (
                                        <a href={`mailto:${employee.email}`} className="text-indigo-600 hover:underline">{employee.email}</a>
                                    ) : <span className="text-slate-400 italic">N/A</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs block mb-1">Phone Number</label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    {employee.phoneNumber ? (
                                        <a href={`tel:${employee.phoneNumber}`} className="text-slate-900 hover:text-indigo-600 transition-colors">{employee.phoneNumber}</a>
                                    ) : <span className="text-slate-400 italic">N/A</span>}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <label className="text-slate-500 text-xs block mb-1">Joined Date</label>
                                <div className="flex items-center gap-2 text-slate-900">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {formatDate(employee.joinDate)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Work & Hierarchy (Span 2) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Reporting Lines - Dynamic List */}
                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-50">
                            <CardTitle className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                <Users className="w-4 h-4" /> Reporting Line
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            {reportingLine.length > 0 ? (
                                <div className="space-y-4 relative">
                                    {/* Vertical connector line */}
                                    {reportingLine.length > 1 && (
                                        <div className="absolute left-[1.15rem] top-3 bottom-8 w-px bg-slate-200" />
                                    )}

                                    {reportingLine.map((approver, index) => (
                                        <div key={index} className="relative flex items-center gap-4">
                                            {/* Dot */}
                                            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center z-10 text-xs font-semibold text-slate-500">
                                                {index + 1}
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                                                <div>
                                                    <div className="text-xs text-slate-500 font-medium">{approver.label}</div>
                                                    <div className="font-semibold text-slate-900">{approver.name || 'Unknown Name'}</div>
                                                </div>
                                                <Badge variant="outline" className="w-fit font-mono font-normal text-slate-500 bg-slate-50 border-slate-200">
                                                    {approver.code}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    No reporting line configuration found.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metrics / Assessment Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card className="border-slate-200 shadow-none">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium uppercase">Assessment Level</div>
                                    <div className="text-xl font-bold text-slate-900">{employee.assessmentLevel}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-none">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-medium uppercase">Warning Status</div>
                                    <div className="font-medium text-slate-900">
                                        {employee.warningCount > 0
                                            ? <span className="text-red-600 font-bold">{employee.warningCount} Warnings</span>
                                            : <span className="text-emerald-600">Clean Record</span>
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
