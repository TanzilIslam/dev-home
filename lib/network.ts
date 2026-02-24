type Listener = (pendingRequests: number) => void;

let pendingRequests = 0;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(pendingRequests);
  }
}

export function beginNetworkRequest() {
  pendingRequests += 1;
  notify();
}

export function endNetworkRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  notify();
}

export function getPendingRequestCount() {
  return pendingRequests;
}

export function subscribeNetwork(listener: Listener) {
  listeners.add(listener);
  listener(pendingRequests);

  return () => {
    listeners.delete(listener);
  };
}
