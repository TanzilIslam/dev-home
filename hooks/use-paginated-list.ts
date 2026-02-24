"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListQueryParams } from "@/types/domain";
import type { PaginatedData, PaginationMeta } from "@/types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const EMPTY_META: PaginationMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

type UsePaginatedListOptions<TItem, TFilters extends object> = {
  fetcher: (params: ListQueryParams & TFilters) => Promise<PaginatedData<TItem>>;
  initialPageSize?: number;
  initialFilters: TFilters;
  onError?: (error: unknown) => void;
};

export function usePaginatedList<TItem, TFilters extends object>(
  options: UsePaginatedListOptions<TItem, TFilters>,
) {
  const { fetcher } = options;
  const onErrorRef = useRef(options.onError);
  const [items, setItems] = useState<TItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    ...EMPTY_META,
    pageSize: options.initialPageSize ?? DEFAULT_PAGE_SIZE,
  });
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(
    options.initialPageSize ?? DEFAULT_PAGE_SIZE,
  );
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TFilters>(options.initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const requestParams = useMemo(
    () => ({
      page,
      pageSize,
      q: query,
      ...filters,
    }),
    [filters, page, pageSize, query],
  );

  const reload = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const updateFilters = useCallback((nextFilters: TFilters) => {
    setFilters(nextFilters);
    setPage(DEFAULT_PAGE);
  }, []);

  const updateQuery = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(DEFAULT_PAGE);
  }, []);

  const updatePageSize = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(DEFAULT_PAGE);
  }, []);

  useEffect(() => {
    let mounted = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function run() {
      setIsLoading(true);

      try {
        const result = await fetcher(requestParams);
        if (!mounted || requestId !== requestIdRef.current) {
          return;
        }

        setError(null);
        setItems(result.items);
        setMeta(result.meta);
      } catch (nextError) {
        if (!mounted || requestId !== requestIdRef.current) {
          return;
        }

        setError(nextError);
        onErrorRef.current?.(nextError);
      } finally {
        if (mounted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [fetcher, refreshKey, requestParams]);

  return {
    items,
    meta,
    page,
    pageSize,
    query,
    filters,
    isLoading,
    error,
    setPage,
    setQuery: updateQuery,
    setPageSize: updatePageSize,
    setFilters: updateFilters,
    reload,
  };
}
