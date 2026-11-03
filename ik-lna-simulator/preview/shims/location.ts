import { resolve } from "./hash-route";

export function currentQuery(): string {
  return resolve(window.location.hash).search;
}
