"use client";

import { useEffect, useMemo, useReducer } from "react";

type FetchResult<T> = {
  data: T | null;
  isLoading: boolean;
};

type State<T> = { key: string; data: T | null; isLoading: boolean } | null;

type Action<T> =
  | { type: "start"; key: string }
  | { type: "success"; key: string; data: T }
  | { type: "error"; key: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "start":
      return state?.key === action.key
        ? { ...state, isLoading: true }
        : { key: action.key, data: null, isLoading: true };
    case "success":
      return { key: action.key, data: action.data, isLoading: false };
    case "error":
      return { key: action.key, data: null, isLoading: false };
  }
}

/**
 * Runs an async fetcher when `key` changes.
 * Automatically cancels stale requests on re-run or unmount.
 * Returns null data and no loading when key is falsy.
 */
export function useCancellableFetch<T>(
  key: string | null | undefined,
  fetcher: (key: string) => Promise<T>,
): FetchResult<T> {
  const [result, dispatch] = useReducer(reducer<T>, null);

  useEffect(() => {
    if (!key) return;

    let cancelled = false;
    dispatch({ type: "start", key });

    fetcher(key)
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", key, data });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error", key });
      });

    return () => {
      cancelled = true;
    };
  }, [key, fetcher]);

  return useMemo(() => {
    if (!key || result?.key !== key) return { data: null, isLoading: !!key };
    return { data: result.data, isLoading: result.isLoading };
  }, [key, result]);
}
