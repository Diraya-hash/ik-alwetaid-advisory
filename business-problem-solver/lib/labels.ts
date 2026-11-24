"use client";

import { useI18n } from "@/components/i18n-provider";
import { FRAMEWORKS } from "@/content/frameworks";
import { DOMAIN_LABEL, STAGE_LABEL } from "@/content/taxonomy";
import type { Reason } from "@/engine/explain";
import type { ApproachId, Domain, Stage } from "@/engine/types";

/** Renders engine reason codes and taxonomy codes in the current language. */
export function useLabels() {
  const { t, l, f } = useI18n();
  const reasons = t.reasons as Record<string, string>;
  return {
    stage: (s: Stage) => l(STAGE_LABEL[s].label),
    domain: (d: string) => (d in DOMAIN_LABEL ? l(DOMAIN_LABEL[d as Domain]) : d),
    framework: (a: ApproachId) => l(FRAMEWORKS[a].name),
    reason: (r: Reason) => {
      const tpl = reasons[r.code] ?? (r.code.startsWith("blocked.") ? reasons["blocked.generic"] : r.code) ?? r.code;
      const p = r.params ?? {};
      return f(tpl, {
        ...(p.stage ? { stage: l(STAGE_LABEL[p.stage as Stage].label) } : {}),
        ...(p.domain ? { domain: p.domain in DOMAIN_LABEL ? l(DOMAIN_LABEL[p.domain as Domain]) : p.domain } : {}),
      });
    },
  };
}
