import type { Scenario } from "@/engine/types";
import { claimsQuality } from "./claims-quality";

/** Only fully authored, playable scenarios are registered here. */
export const scenarios: Scenario[] = [claimsQuality];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
