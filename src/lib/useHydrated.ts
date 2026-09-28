import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true afterwards. Lets pages read
 * things the prerendered HTML couldn't know about (like ?q= in the URL)
 * without a hydration mismatch.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
