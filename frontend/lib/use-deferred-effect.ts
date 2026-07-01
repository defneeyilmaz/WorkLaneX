import { useEffect } from "react";

export function useDeferredEffect(
  effect: (isCancelled: () => boolean) => void | Promise<void>,
  deps: React.DependencyList,
) {
  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      await effect(isCancelled);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, deps);
}
