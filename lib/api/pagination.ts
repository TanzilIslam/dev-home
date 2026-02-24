import type { PaginationMeta } from "@/types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export interface ListQuery {
  page: number;
  pageSize: number;
  search: string;
  all: boolean;
  dropdown: boolean;
}

export function parseListQuery(searchParams: URLSearchParams): ListQuery {
  const parsedPage = Number(searchParams.get("page"));
  const parsedPageSize = Number(searchParams.get("pageSize"));
  const page = Number.isFinite(parsedPage) && parsedPage > 0
    ? Math.floor(parsedPage)
    : DEFAULT_PAGE;
  const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0
    ? Math.min(Math.floor(parsedPageSize), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    search: (searchParams.get("q") ?? "").trim(),
    all: searchParams.get("all") === "true",
    dropdown: searchParams.get("dropdown") === "true",
  };
}

export function resolvePagination(total: number, query: ListQuery) {
  if (query.all) {
    const effectivePageSize = total > 0 ? total : query.pageSize;

    return {
      skip: 0,
      take: undefined as number | undefined,
      page: 1,
      pageSize: effectivePageSize,
    };
  }

  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export function getPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  if (total <= 0 || pageSize <= 0) {
    return {
      page: 1,
      pageSize,
      total,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  const totalPages = Math.ceil(total / pageSize);
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);

  return {
    page: normalizedPage,
    pageSize,
    total,
    totalPages,
    hasNext: normalizedPage < totalPages,
    hasPrev: normalizedPage > 1,
  };
}
