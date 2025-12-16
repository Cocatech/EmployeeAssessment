import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    searchParams?: Record<string, string | string[] | undefined>;
}

export function PaginationControl({
    currentPage,
    totalPages,
    baseUrl,
    searchParams,
}: PaginationControlProps) {
    // Helper to build URL with existing search params + new page
    const createPageUrl = (page: number) => {
        const params = new URLSearchParams();

        // Add existing search params
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    params.set(key, value);
                } else if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                }
            });
        }

        // Set page param
        params.set('page', page.toString());

        return `${baseUrl}?${params.toString()}`;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1">
                <Link href={createPageUrl(1)}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage <= 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={createPageUrl(Math.max(1, currentPage - 1))}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium">
                Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-1">
                <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={createPageUrl(totalPages)}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={currentPage >= totalPages}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
