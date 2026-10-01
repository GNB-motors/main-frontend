import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { pageItems } from './pagerItems';

/** Server-side pager shared by the Reports tables. Renders nothing for one page. */
export default function ReportPagination({ page, totalPages, onPage }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <Pagination className="mx-0 w-auto justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPage(page - 1)}
            className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
          />
        </PaginationItem>
        {pageItems(totalPages, page).map((item, idx) =>
          item === '...' ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={page === item}
                onClick={() => onPage(item)}
                className="cursor-pointer"
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onPage(page + 1)}
            className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
