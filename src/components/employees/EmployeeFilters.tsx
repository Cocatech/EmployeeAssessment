'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface EmployeeFiltersProps {
  groups: string[];
}

export function EmployeeFilters({ groups }: EmployeeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 500);

  // Sync state with URL only on mount or external navigation (e.g. back button)
  // We use a separate effect for this to avoid loop
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
    // We purposefully omit 'search' from deps to avoid resetting while typing if generic refresh happens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync URL with Debounced Search
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentInUrl = params.get('search') || '';

    // Only push if value actually changed from what's in URL
    if (debouncedSearch !== currentInUrl) {
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`);
    }
  }, [debouncedSearch, router, searchParams]);

  const handleGroupFilter = (group: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (params.get('group') === group) {
      params.delete('group');
    } else {
      params.set('group', group);
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
    router.push('/dashboard/employees');
  };

  const activeGroup = searchParams.get('group');
  const activeType = searchParams.get('type');
  const hasActiveFilters = search || activeGroup || activeType;

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
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeType === 'Permanent'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
        >
          Permanent
        </button>
        <button
          onClick={() => handleTypeFilter('Temporary')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeType === 'Temporary'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
            }`}
        >
          Temporary
        </button>

        {/* Group Filters */}
        {groups.map((grp) => (
          <button
            key={grp}
            onClick={() => handleGroupFilter(grp)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeGroup === grp
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
          >
            {grp}
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
