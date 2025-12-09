'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmployeeFiltersProps {
  departments: string[];
}

export function EmployeeFilters({ departments }: EmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    router.push(`?${params.toString()}`);
  }, [search, searchParams, router]);

  const handleDepartmentFilter = (department: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (params.get('department') === department) {
      params.delete('department');
    } else {
      params.set('department', department);
    }
    
    router.push(`?${params.toString()}`);
  };

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (params.get('type') === type) {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch('');
    router.push('/admin/employees');
  };

  const activeDepartment = searchParams.get('department');
  const activeType = searchParams.get('type');
  const hasActiveFilters = search || activeDepartment || activeType;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {/* Employee Type Filter */}
        <button
          onClick={() => handleTypeFilter('Permanent')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            activeType === 'Permanent'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          Permanent
        </button>
        <button
          onClick={() => handleTypeFilter('Temporary')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            activeType === 'Temporary'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
          }`}
        >
          Temporary
        </button>

        {/* Department Filters */}
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => handleDepartmentFilter(dept)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeDepartment === dept
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {dept}
          </button>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
