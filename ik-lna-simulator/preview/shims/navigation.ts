import { useMemo } from "react";
import { navigate, resolve, useHash } from "./hash-route";

export function usePathname(): string {
  return resolve(useHash()).pathname;
}

export function useSearchParams(): URLSearchParams {
  const hash = useHash();
  return useMemo(() => new URLSearchParams(resolve(hash).search), [hash]);
}

const router = {
  push: (path: string) => navigate(path),
  replace: (path: string) => navigate(path),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => {},
  prefetch: () => {},
};
export function useRouter() {
  return router;
}

export function notFound(): never {
  throw new Error("Not found");
}
