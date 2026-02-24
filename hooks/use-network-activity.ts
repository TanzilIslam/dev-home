"use client";

import { useEffect, useState } from "react";
import { getPendingRequestCount, subscribeNetwork } from "@/lib/network";

export function useNetworkActivity() {
  const [pendingRequests, setPendingRequests] = useState(getPendingRequestCount);

  useEffect(() => {
    return subscribeNetwork((nextPendingRequests) => {
      setPendingRequests(nextPendingRequests);
    });
  }, []);

  return {
    pendingRequests,
    isLoading: pendingRequests > 0,
  };
}
