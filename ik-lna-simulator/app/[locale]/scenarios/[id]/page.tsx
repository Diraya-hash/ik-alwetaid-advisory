import { notFound } from "next/navigation";
import { getScenario, scenarios } from "@/content/scenarios";
import { BriefingView } from "@/components/views/briefing";
import { LOCALES } from "@/i18n/config";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => scenarios.map((s) => ({ locale, id: s.id })));
}

export default function Page({ params }: { params: { id: string } }) {
  if (!getScenario(params.id)) notFound();
  return <BriefingView scenarioId={params.id} />;
}
