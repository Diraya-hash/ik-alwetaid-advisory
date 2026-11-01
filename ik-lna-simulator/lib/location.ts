/** The current query string ("?a=b" or ""). The preview build swaps this module for a hash-router version. */
export function currentQuery(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}
