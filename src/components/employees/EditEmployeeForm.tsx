'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { updateEmployee } from '@/actions/employees';
import { ImageUpload } from './ImageUpload';

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

interface EditEmployeeFormProps {
  employee: any;
  allEmployees: Employee[];
  positions: Position[];
  groups: Group[];
  teams: Team[];
}

export function EditEmployeeForm({ 
  employee,
  allEmployees,
  positions,
  groups,
  teams
}: EditEmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    employee.group ? employee.group.split(',').map((g: string) => g.trim()) : []
  );
  const [selectedTeams, setSelectedTeams] = useState<string[]>(
    employee.team ? employee.team.split(',').map((t: string) => t.trim()).filter(Boolean) : []
  );
  const [profileImage, setProfileImage] = useState<string | null>(
    employee.profileImage || null
  );

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
      gm_ID: formData.get('gm_ID') as string || undefined,
      isActive: formData.get('isActive') === 'true',
    };

    try {
      const result = await updateEmployee(employee.empCode, data);
      
      if (result.success) {
        router.push(`/admin/employees/${employee.empCode}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to update employee');
      }
    } catch (err) {
      setError('An error occurred while updating employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePositions = positions.filter(p => p.isActive);
  const activeGroups = groups.filter(g => g.isActive);
  const activeTeams = teams.filter(t => t.isActive);

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
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
              <label className="text-sm font-medium">
                Employee Code
              </label>
              <Input
                value={employee.empCode}
                disabled
                className="bg-gray-50"
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
                defaultValue={employee.empName_Eng}
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
                defaultValue={employee.empName_Thai || ''}
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
                defaultValue={employee.email || ''}
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
                defaultValue={employee.phoneNumber || ''}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Join Date
              </label>
              <Input
                type="date"
                value={new Date(employee.joinDate).toISOString().split('T')[0]}
                disabled
                className="bg-gray-50"
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
                defaultValue={employee.position}
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
                defaultValue={employee.assessmentLevel}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Level</option>
                <option value="Management">Management (6+)</option>
                <option value="Supervise">Supervise (4-5)</option>
                <option value="Operate">Operate (1-3)</option>
                <option value="Interpreter">Interpreter</option>
                <option value="General">General</option>
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
                defaultValue={employee.employeeType}
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
          <h2 className="text-lg font-semibold mb-4">Approval Chain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="approver1_ID" className="text-sm font-medium">
                Manager (Approver 1)
              </label>
              <select
                id="approver1_ID"
                name="approver1_ID"
                disabled={isSubmitting}
                defaultValue={employee.approver1_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select Manager</option>
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
                defaultValue={employee.approver2_ID || ''}
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
                defaultValue={employee.approver3_ID || ''}
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
              <label htmlFor="gm_ID" className="text-sm font-medium">
                General Manager
              </label>
              <select
                id="gm_ID"
                name="gm_ID"
                disabled={isSubmitting}
                defaultValue={employee.gm_ID || ''}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select GM</option>
                {allEmployees.map((emp) => (
                  <option key={emp.empCode} value={emp.empCode}>
                    {emp.empCode} - {emp.empName_Eng}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              value="true"
              defaultChecked={employee.isActive}
              disabled={isSubmitting}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
