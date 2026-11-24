import { notFound } from "next/navigation";
import { FrameworkDetailView } from "@/components/views/library";
import { LOCALES } from "@/i18n/config";
import { APPROACH_IDS, type ApproachId } from "@/engine/types";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => APPROACH_IDS.map((id) => ({ locale, id })));
}

export default function Page({ params }: { params: { id: string } }) {
  if (!(APPROACH_IDS as readonly string[]).includes(params.id)) notFound();
  return <FrameworkDetailView id={params.id as ApproachId} />;
}
