import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '../utils';

const PaginationFooter = ({ page, totalPages, totalResults, onPageChange, unit = 'entries' }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Page <span className="num font-medium text-foreground">{page}</span> of{' '}
        <span className="num font-medium text-foreground">{totalPages}</span>
        {totalResults ? (
          <>
            {' · '}
            <span className="num font-medium text-foreground">{formatNumber(totalResults)}</span> {unit}
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default PaginationFooter;
