"use client";

import { useCallback, useRef, useState } from "react";
import type { DropdownListData } from "@/types/domain";
import type { SelectOption } from "@/types/dashboard";

type DropdownFetcher = (params: Record<string, unknown>) => Promise<DropdownListData>;

export function useDropdownLoader(fetcher: DropdownFetcher) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (params?: Record<string, unknown>) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const response = await fetcher({ all: true, ...params });
        if (requestId !== requestIdRef.current) return;
        setOptions(response.items.map((item) => ({ id: item.id, label: item.name })));
      } catch {
        if (requestId !== requestIdRef.current) return;
        setOptions([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fetcher],
  );

  const clear = useCallback(() => {
    ++requestIdRef.current;
    setOptions([]);
    setLoading(false);
  }, []);

  return { options, loading, load, clear } as const;
}
