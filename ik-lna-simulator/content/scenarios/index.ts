import type { Scenario } from "@/engine/types";
import { claimsQuality } from "./claims-quality";
import { serviceCentre } from "./service-centre";
import { quietTeam } from "./quiet-team";
import { platformAdoption } from "./platform-adoption";
import { mergerHangover } from "./merger-hangover";
import { emptyBench } from "./empty-bench";
import { sharedServices } from "./shared-services";
import { strategyStalled } from "./strategy-stalled";

/** Only fully authored, playable scenarios are registered here. */
export const scenarios: Scenario[] = [claimsQuality, serviceCentre, quietTeam, platformAdoption, mergerHangover, emptyBench, sharedServices, strategyStalled];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
