"use client";

import { useCallback, useRef, useState } from "react";
import type { DropdownListData } from "@/types/domain";
import type { SelectOption } from "@/types/dashboard";

type DropdownFetcher = (params: Record<string, unknown>) => Promise<DropdownListData>;

export function useDropdownLoader(fetcher: DropdownFetcher) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (params?: Record<string, unknown>) => {
      const requestId = ++requestIdRef.current;
      try {
        const response = await fetcher({ all: true, ...params });
        if (requestId !== requestIdRef.current) return;
        setOptions(
          response.items.map((item) => ({ id: item.id, label: item.name })),
        );
      } catch {
        if (requestId !== requestIdRef.current) return;
        setOptions([]);
      }
    },
    [fetcher],
  );

  const clear = useCallback(() => {
    ++requestIdRef.current;
    setOptions([]);
  }, []);

  return { options, load, clear } as const;
}
