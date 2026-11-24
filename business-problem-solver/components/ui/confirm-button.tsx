"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "./button";

/**
 * Two-step destructive action confirmed inside the page.
 * (Native confirm() is unavailable in sandboxed hosts and blocks the UI elsewhere.)
 */
export function ConfirmButton({
  question,
  onConfirm,
  children,
  label,
}: {
  question: string;
  onConfirm: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  const { t } = useI18n();
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (asking) confirmRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <Button variant="danger" onClick={() => setAsking(true)} aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <div role="alertdialog" aria-label={question} className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft p-2">
      <span className="px-1 text-[13px] text-danger">{question}</span>
      <Button
        variant="danger"
        size="sm"
        ref={confirmRef}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {t.common.confirm}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>
        {t.common.cancel}
      </Button>
    </div>
  );
}
