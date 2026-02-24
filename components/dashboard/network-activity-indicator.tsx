"use client";

import { Spinner } from "@/components/ui/spinner";
import { useNetworkActivity } from "@/hooks/use-network-activity";

export function NetworkActivityIndicator() {
  const { isLoading, pendingRequests } = useNetworkActivity();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex items-center justify-center">
      <div className="bg-primary/95 text-primary-foreground flex items-center gap-2 rounded-b-md px-3 py-1 text-xs shadow-sm">
        <Spinner className="size-3.5" />
        Syncing {pendingRequests} request{pendingRequests > 1 ? "s" : ""}
      </div>
    </div>
  );
}
