"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { PaginationMeta } from "@/types/pagination";
import { Button } from "@/components/ui/button";

type ResourcePaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
};

export function ResourcePagination({ meta, onPageChange }: ResourcePaginationProps) {
  const pageLabel =
    meta.totalPages === 0
      ? "No pages"
      : `Page ${meta.page} of ${meta.totalPages}`;

  return (
    <div className="flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground" role="status" aria-live="polite">
        {pageLabel} 
        <span className="ml-1">({meta.total} total items)</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
        >
          <ChevronLeftIcon className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
