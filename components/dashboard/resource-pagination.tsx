"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { PaginationMeta } from "@/types/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type ResourcePaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
};

export function ResourcePagination({ meta, onPageChange, pageSize, onPageSizeChange }: ResourcePaginationProps) {
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
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-35" aria-label="Rows per page">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent align="end">
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
