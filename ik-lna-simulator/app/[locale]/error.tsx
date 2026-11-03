"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  console.error(error);
  return <EmptyState icon={AlertTriangle} title={t.errors.title} body={t.errors.body} action={<Button onClick={reset}>{t.errors.retry}</Button>} />;
}
