import type { Scenario } from "@/engine/types";
import { claimsQuality } from "./claims-quality";
import { serviceCentre } from "./service-centre";
import { quietTeam } from "./quiet-team";

/** Only fully authored, playable scenarios are registered here. */
export const scenarios: Scenario[] = [claimsQuality, serviceCentre, quietTeam];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
