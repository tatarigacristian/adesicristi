"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Syncs a tab state with a URL query parameter (e.g. ?tab=financiar).
 * On mount, reads the param from the URL. On change, updates the URL without full navigation.
 */
export function useTabParam<T extends string>(
  paramName: string,
  defaultValue: T,
  validValues: readonly T[]
): [T, (tab: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getInitial = (): T => {
    const raw = searchParams.get(paramName);
    if (raw && (validValues as readonly string[]).includes(raw)) {
      return raw as T;
    }
    return defaultValue;
  };

  const [tab, setTabState] = useState<T>(getInitial);

  // Sync from URL changes (e.g. browser back/forward)
  useEffect(() => {
    const raw = searchParams.get(paramName);
    if (raw && (validValues as readonly string[]).includes(raw)) {
      setTabState(raw as T);
    } else {
      setTabState(defaultValue);
    }
  }, [searchParams, paramName, validValues, defaultValue]);

  const setTab = useCallback(
    (newTab: T) => {
      setTabState(newTab);
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === defaultValue) {
        params.delete(paramName);
      } else {
        params.set(paramName, newTab);
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [searchParams, paramName, defaultValue, pathname, router]
  );

  return [tab, setTab];
}
