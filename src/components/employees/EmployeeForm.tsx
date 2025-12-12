'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X, RotateCcw, UserCheck, UserX } from 'lucide-react';
import { createEmployee, updateEmployee } from '@/actions/employees';
import { resetUserPassword, toggleUserStatus, createUserForEmployee, setUserPassword, updateUserRole } from '@/actions/users';
import { ImageUpload } from './ImageUpload';
import { ASSESSMENT_LEVELS } from '@/lib/assessment-levels';

interface Position {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface Group {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface Team {
  id: string;
  code: string;
  name: string;
  groupCode?: string | null;
  isActive: boolean;
}

interface Employee {
  empCode: string;
  empName_Eng: string;
  position: string;
}

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  // For edit mode
  employee?: any;
  // Shared data
  allEmployees: Employee[];
  positions: any[];
  groups: any[];
  teams: any[];
  currentUser?: any;
  returnUrl?: string; // Optional return URL
}

export function EmployeeForm({
  mode,
  employee,
  allEmployees,
  positions,
  groups,
  teams,
  currentUser,
  returnUrl
}: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserActionProcessing, setIsUserActionProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initial values depend on mode
  const initialData = mode === 'edit' ? employee : {};

  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    initialData?.group ? initialData.group.split(',').map((g: string) => g.trim()) : []
  );
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    initialData?.team ? initialData.team.split(',').map((t: string) => t.trim()).filter(Boolean) : []
  );
  const [profileImage, setProfileImage] = useState<string | null>(
    initialData?.profileImage || null
  );

  // User Management State
  const [newPassword, setNewPassword] = useState('');
  const [userRole, setUserRole] = useState(initialData?.user?.role || 'EMPLOYEE');
  const [userType, setUserType] = useState(initialData?.user?.userType || 'EMPLOYEE');

  // Create Mode User State
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('EMPLOYEE');
  const [createType, setCreateType] = useState('EMPLOYEE');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreatePassword(pass);
  };

  const handleGroupToggle = (groupCode: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupCode)
        ? prev.filter(g => g !== groupCode)
        : [...prev, groupCode]
    );
  };

  const handleTeamToggle = (teamCode: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamCode)
        ? prev.filter(t => t !== teamCode)
        : [...prev, teamCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      empName_Eng: formData.get('empName_Eng') as string,
      empName_Thai: formData.get('empName_Thai') as string || undefined,
      email: formData.get('email') as string || undefined,
      phoneNumber: formData.get('phoneNumber') as string || undefined,
      profileImage: profileImage,
      position: formData.get('position') as string,
      group: selectedGroups.join(','),
      team: selectedTeams.length > 0 ? selectedTeams.join(',') : undefined,
      assessmentLevel: formData.get('assessmentLevel') as string,
      employeeType: formData.get('employeeType') as 'Permanent' | 'Temporary',
      approver1_ID: formData.get('approver1_ID') as string || undefined,
      approver2_ID: formData.get('approver2_ID') as string || undefined,
      approver3_ID: formData.get('approver3_ID') as string || undefined,
      manager_ID: formData.get('manager_ID') as string || undefined,
      gm_ID: formData.get('gm_ID') as string || undefined,
      isActive: formData.get('isActive') === 'true',
      // Create specific
      empCode: mode === 'create' ? formData.get('empCode') as string : undefined,
      joinDate: formData.get('joinDate') as string, // String for create/update
      warningCount: parseInt(formData.get('warningCount') as string) || 0,
    };

    try {
      let result;
      if (mode === 'create') {
        // Create requires empCode and joinDate
        if (!data.empCode) throw new Error('Employee Code is required');
        const payload = {
          ...data,
          empCode: data.empCode!,
          password: createPassword, // Optional
          userRole: createRole,
          userType: createType
        };
        result = await createEmployee(payload as any);
      } else {
        // Update
        result = await updateEmployee(employee.empCode, data);
      }

      if (result.success) {
        if (returnUrl) {
          router.push(returnUrl);
        } else if (mode === 'create') {
          router.push('/admin/employees');
        } else {
          router.push(`/admin/employees/${employee.empCode}`);
          setSuccessMessage('Employee saved successfully');
        }
        router.refresh();
      } else {
        setError(result.error || 'Failed to save employee');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    if (!initialData.empCode) return;
    if (!confirm('Are you sure you want to create a User account for this employee?')) return;

    setIsUserActionProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await createUserForEmployee(initialData.empCode);
      if (result.success) {
        setSuccessMessage('User account created successfully.');
        router.refresh();
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUserActionProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!initialData.empCode) return;
    if (!confirm('Are you sure you want to reset password to "Welcome@2025"?')) return;

    setIsUserActionProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await resetUserPassword(initialData.empCode);
      if (result.success) {
        setSuccessMessage(result.message || 'Password reset successfully');
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUserActionProcessing(false);
    }
  };

  const handleToggleUserStatus = async (currentStatus: boolean) => {
    if (!initialData.empCode) return;
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this user account?`)) return;

    setIsUserActionProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await toggleUserStatus(initialData.empCode, newStatus);
      if (result.success) {
        setSuccessMessage(`User account ${action}d successfully.`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update user status');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUserActionProcessing(false);
    }
  };

  const handleSetPassword = async () => {
    if (!initialData.empCode || !newPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!confirm('Are you sure you want to change the password for this user?')) return;

    setIsUserActionProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await setUserPassword(initialData.empCode, newPassword);
      if (result.success) {
        setSuccessMessage('Password updated successfully');
        setNewPassword(''); // Clear input
      } else {
        setError(result.error || 'Failed to update password');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUserActionProcessing(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!initialData.empCode) return;
    if (!confirm(`Update Role to ${userRole} and Type to ${userType}?`)) return;

    setIsUserActionProcessing(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await updateUserRole(initialData.empCode, userRole, userType);
      if (result.success) {
        setSuccessMessage('User role updated successfully');
        router.refresh(); // Refresh to get latest data
      } else {
        setError(result.error || 'Failed to update role');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsUserActionProcessing(false);
    }
  };

  const activePositions = positions.filter(p => p.isActive);
  const activeGroups = groups.filter(g => g.isActive);
  const activeTeams = teams.filter(t => t.isActive);

  // User Section Data
  const linkedUser = employee?.user;

  return (
    <form onSubmit={handleSubmit}>
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* User Account Management (Only in Edit Mode) */}
        {mode === 'edit' && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
            {/* Header with Status */}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              User Account Management
              {linkedUser ? (
                <span className={`text-xs px-2 py-0.5 rounded-full ${linkedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {linkedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Not Linked</span>
              )}
            </h2>

            {linkedUser ? (
              <div className="space-y-4">
                {/* Row 1: Info & Activation */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-200 pb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Username:</span> {linkedUser.email || linkedUser.empCode}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={linkedUser.isActive ? "destructive" : "default"}
                    onClick={() => handleToggleUserStatus(linkedUser.isActive)}
                    disabled={isUserActionProcessing}
                  >
                    {linkedUser.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                    {linkedUser.isActive ? 'Deactivate User' : 'Activate User'}
                  </Button>
                </div>

                {/* Row 2: Password Management */}
                <div className="flex flex-wrap items-end gap-4 border-b border-blue-200 pb-4">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <label className="text-xs font-medium uppercase text-blue-800">Change Password</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="New password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-white h-9"
                        disabled={isUserActionProcessing}
                      />
                      <Button type="button" size="sm" onClick={handleSetPassword} disabled={isUserActionProcessing || !newPassword}>
                        Set
                      </Button>
                    </div>
                  </div>
                  <div className="flex-none">
                    <span className="text-xs text-muted-foreground mr-2">or</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleResetPassword}
                      disabled={isUserActionProcessing}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </Button>
                  </div>
                </div>

                {/* Row 3: Role Configuration */}
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-2 w-1/3 min-w-[150px]">
                    <label className="text-xs font-medium uppercase text-blue-800">User Role</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      disabled={isUserActionProcessing}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2 w-1/3 min-w-[150px]">
                    <label className="text-xs font-medium uppercase text-blue-800">User Type</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      disabled={isUserActionProcessing}
                    >
                      <option value="EMPLOYEE">Standard Employee</option>
                      <option value="SYSTEM_ADMIN">System Admin</option>
                    </select>
                  </div>
                  <Button type="button" size="sm" onClick={handleUpdateRole} disabled={isUserActionProcessing}>
                    Update Role
                  </Button>
                </div>

              </div>
            ) : (
              // Unlinked View
              <div className="flex items-center justify-between w-full mt-2">
                <p className="text-sm text-muted-foreground">
                  This employee does not have a linked user account for system access.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateUser}
                  disabled={isUserActionProcessing || !initialData.email}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Create User Account
                </Button>
              </div>
            )}

            {!linkedUser && !initialData.email && (
              <p className="text-xs text-amber-600 mt-2">
                * Email address is required to create a user account.
              </p>
            )}
          </div>
        )}

        {/* User Account Setup (Create Mode) */}
        {mode === 'create' && (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              User Account Setup
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              A user account will be automatically created for this employee.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User Role</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  {(currentUser?.role === 'ADMIN' || currentUser?.userType === 'SYSTEM_ADMIN') && (
                    <option value="ADMIN">Admin</option>
                  )}
                </select>
              </div>

              {/* Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">User Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                >
                  <option value="EMPLOYEE">Standard Employee</option>
                  {(currentUser?.userType === 'SYSTEM_ADMIN') && (
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  )}
                </select>
              </div>

              {/* Password Setting */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Password</label>
                <div className="flex gap-2">
                  <Input
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomPassword}>
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default: Welcome@2025
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          {/* Profile Image */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Profile Photo
            </label>
            <ImageUpload
              currentImage={profileImage}
              onImageChange={setProfileImage}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="empCode" className="text-sm font-medium">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <Input
                id="empCode"
                name="empCode"
                placeholder="e.g., EMP001"
                required={mode === 'create'}
                disabled={mode === 'edit' || isSubmitting}
                defaultValue={initialData?.empCode}
                className={mode === 'edit' ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="empName_Eng" className="text-sm font-medium">
                English Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="empName_Eng"
                name="empName_Eng"
                placeholder="e.g., John Smith"
                required
                disabled={isSubmitting}
                defaultValue={initialData?.empName_Eng}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="empName_Thai" className="text-sm font-medium">
                Thai Name
              </label>
              <Input
                id="empName_Thai"
                name="empName_Thai"
                placeholder="e.g., จอห์น สมิธ"
                disabled={isSubmitting}
                defaultValue={initialData?.empName_Thai || ''}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.smith@company.com"
                disabled={isSubmitting}
                defaultValue={initialData?.email || ''}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="081-234-5678"
                disabled={isSubmitting}
                defaultValue={initialData?.phoneNumber || ''}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Join Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="joinDate"
                name="joinDate"
                type="date"
                required
                disabled={mode === 'edit'} // Usually join date is fixed? Or allow edit? Let's allow edit if needed, wait, previous form disabled it. I will enable it for Create, disable for Edit?
                // Previous Edit form had it DISABLED.
                // Previous Create form had it REQUIRED.
                readOnly={mode === 'edit'}
                className={mode === 'edit' ? "bg-gray-50" : ""}
                defaultValue={initialData?.joinDate ? new Date(initialData.joinDate).toISOString().split('T')[0] : ''}
              />
            </div>
          </div>
        </div>

        {/* Position & Department */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Position & Department</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position Dropdown */}
            <div className="space-y-2">
              <label htmlFor="position" className="text-sm font-medium">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                id="position"
                name="position"
                required
                disabled={isSubmitting}
                defaultValue={initialData?.position}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Position</option>
                {activePositions.map((pos) => (
                  <option key={pos.id} value={pos.name}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Level */}
            <div className="space-y-2">
              <label htmlFor="assessmentLevel" className="text-sm font-medium">
                Assessment Level <span className="text-red-500">*</span>
              </label>
              <select
                id="assessmentLevel"
                name="assessmentLevel"
                required
                disabled={isSubmitting}
                defaultValue={initialData?.assessmentLevel}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Level</option>
                {ASSESSMENT_LEVELS.map((level) => (
                  <option key={level.code} value={level.code}>
                    {level.code} - {level.name} ({level.description})
                  </option>
                ))}
              </select>
            </div>

            {/* Group Multi-select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Group <span className="text-red-500">*</span>
              </label>
              <div className="border border-input rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                {activeGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups available</p>
                ) : (
                  <div className="space-y-2">
                    {activeGroups.map((group) => (
                      <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.code)}
                          onChange={() => handleGroupToggle(group.code)}
                          disabled={isSubmitting}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                            {group.code}
                          </span>
                          {group.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedGroups.map((code) => (
                    <span key={code} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {code}
                      <button
                        type="button"
                        onClick={() => handleGroupToggle(code)}
                        className="hover:bg-primary/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Team Multi-select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Team
              </label>
              <div className="border border-input rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                {activeTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teams available</p>
                ) : (
                  <div className="space-y-2">
                    {activeTeams.map((team) => (
                      <label key={team.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.code)}
                          onChange={() => handleTeamToggle(team.code)}
                          disabled={isSubmitting}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                            {team.code}
                          </span>
                          {team.name}
                          {team.groupCode && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({team.groupCode})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedTeams.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTeams.map((code) => (
                    <span key={code} className="inline-flex items-center gap-1 bg-purple/10 text-purple-700 px-2 py-1 rounded text-xs">
                      {code}
                      <button
                        type="button"
                        onClick={() => handleTeamToggle(code)}
                        className="hover:bg-purple/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Employee Type */}
            <div className="space-y-2">
              <label htmlFor="employeeType" className="text-sm font-medium">
                Employee Type <span className="text-red-500">*</span>
              </label>
              <select
                id="employeeType"
                name="employeeType"
                required
                disabled={isSubmitting}
                defaultValue={initialData?.employeeType}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Type</option>
                <option value="Permanent">Permanent</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Approvers */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Approval Chain (5 Levels)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="approver1_ID" className="text-sm font-medium">
                Approver 1
              </label>
              <select
                id="approver1_ID"
                name="approver1_ID"
                disabled={isSubmitting}
                defaultValue={initialData?.approver1_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Approver 1</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="approver2_ID" className="text-sm font-medium">
                Approver 2
              </label>
              <select
                id="approver2_ID"
                name="approver2_ID"
                disabled={isSubmitting}
                defaultValue={initialData?.approver2_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Approver 2</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="approver3_ID" className="text-sm font-medium">
                Approver 3
              </label>
              <select
                id="approver3_ID"
                name="approver3_ID"
                disabled={isSubmitting}
                defaultValue={initialData?.approver3_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Approver 3</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="manager_ID" className="text-sm font-medium">
                Line Manager <span className="text-red-500">*</span>
              </label>
              <select
                id="manager_ID"
                name="manager_ID"
                required
                disabled={isSubmitting}
                defaultValue={initialData?.manager_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Line Manager</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="gm_ID" className="text-sm font-medium">
                MD / GM <span className="text-red-500">*</span>
              </label>
              <select
                id="gm_ID"
                name="gm_ID"
                disabled={isSubmitting}
                defaultValue={initialData?.gm_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select MD / GM</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status & Disciplinary */}
        <div className="pt-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Status & Disciplinary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  value="true"
                  defaultChecked={initialData?.isActive ?? true}
                  disabled={isSubmitting}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active Account
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="warningCount" className="text-sm font-medium text-red-600">
                Warning Letters (Count)
              </label>
              <Input
                id="warningCount"
                name="warningCount"
                type="number"
                min="0"
                placeholder="0"
                disabled={isSubmitting}
                defaultValue={initialData?.warningCount || 0}
                className="max-w-[150px]"
              />
              <p className="text-xs text-muted-foreground">Each warning calculates as penalty.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Employee' : 'Save Changes')}
          </Button>
        </div>
      </div>
    </form>
  );
}
