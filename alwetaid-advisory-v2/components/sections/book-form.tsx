"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  organization: string;
  role: string;
  engagementType: string;
  orgSize: string;
  timeline: string;
  context: string;
};

const engagementTypes = [
  "Corporate engagement",
  "Individual advisory",
  "Exploratory conversation",
  "Not sure yet",
];

const orgSizes = [
  "Under 250",
  "250 – 2,500",
  "2,500 – 10,000",
  "10,000+",
  "Not applicable",
];

const timelines = [
  "Within 30 days",
  "Within the quarter",
  "Next quarter",
  "Exploring options",
];

export function BookForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    organization: "",
    role: "",
    engagementType: engagementTypes[0],
    orgSize: orgSizes[1],
    timeline: timelines[1],
    context: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Required";
    if (!form.email.trim()) next.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email";
    if (!form.role.trim()) next.role = "Required";
    if (!form.context.trim()) next.context = "Required";
    else if (form.context.trim().length < 30)
      next.context = "Please share a bit more context (30+ characters)";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate network — replace with real API
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-canvas-card border border-emerald/15 rounded-2xl p-10 lg:p-14 text-center max-w-2xl mx-auto"
      >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-canvas mb-8">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-3xl font-medium text-ink leading-tight tracking-tighter mb-5">
          Thank you, <em className="text-emerald font-normal">{form.name.split(" ")[0]}</em>.
        </h3>
        <p className="text-base text-ink-500 leading-relaxed max-w-md mx-auto">
          Your request has been received. I personally review every inquiry and will
          respond within two business days — typically with a proposed time for a
          first conversation.
        </p>
        <p className="mt-6 text-[13px] text-ink-400">
          Reply will come from <span className="font-mono">advisory@ikalwetaid.com</span>.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-3xl">
      {/* Section 1 — Identity */}
      <div className="space-y-5">
        <SectionLabel index="01" title="About you" />
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Name" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass(!!errors.name)}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass(!!errors.email)}
            />
          </Field>
          <Field label="Role / Title" error={errors.role}>
            <input
              type="text"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="e.g. CHRO, VP Talent, Head of L&D"
              className={inputClass(!!errors.role)}
            />
          </Field>
          <Field label="Organization" hint="optional">
            <input
              type="text"
              value={form.organization}
              onChange={(e) => update("organization", e.target.value)}
              className={inputClass(false)}
            />
          </Field>
        </div>
      </div>

      {/* Section 2 — Engagement */}
      <div className="space-y-5">
        <SectionLabel index="02" title="The engagement" />
        <Field label="Engagement type">
          <ChipGroup
            options={engagementTypes}
            value={form.engagementType}
            onChange={(v) => update("engagementType", v)}
          />
        </Field>
        <Field label="Organization size">
          <ChipGroup
            options={orgSizes}
            value={form.orgSize}
            onChange={(v) => update("orgSize", v)}
          />
        </Field>
        <Field label="Timeline">
          <ChipGroup
            options={timelines}
            value={form.timeline}
            onChange={(v) => update("timeline", v)}
          />
        </Field>
      </div>

      {/* Section 3 — Context */}
      <div className="space-y-5">
        <SectionLabel index="03" title="The question" />
        <Field
          label="What are you trying to solve?"
          hint="A paragraph is enough"
          error={errors.context}
        >
          <textarea
            rows={5}
            value={form.context}
            onChange={(e) => update("context", e.target.value)}
            placeholder="A few sentences on the situation. Discretion is assumed — share what's helpful."
            className={cn(inputClass(!!errors.context), "resize-none leading-relaxed")}
          />
        </Field>
      </div>

      {/* Submit */}
      <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <p className="text-[12.5px] text-ink-400 leading-relaxed max-w-md">
          Every inquiry is reviewed personally. Expect a response within two business
          days.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            <>Submit request</>
          )}
        </Button>
      </div>
    </form>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 pb-3 border-b border-emerald/10">
      <span className="font-mono text-[11px] text-emerald/50 tracking-wider">
        {index}
      </span>
      <span className="text-[11px] uppercase tracking-[0.22em] text-emerald font-medium">
        {title}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12.5px] font-medium text-ink-600 tracking-tight">
          {label}
        </span>
        {(hint || error) && (
          <span
            className={cn(
              "text-[11px]",
              error ? "text-red-600" : "text-ink-400 italic"
            )}
          >
            {error ?? hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3.5 py-2 rounded-full text-[13px] font-medium tracking-tight transition-all",
            value === opt
              ? "bg-emerald text-canvas border border-emerald"
              : "bg-canvas-card border border-emerald/15 text-ink-500 hover:border-emerald/30 hover:text-emerald"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-lg bg-canvas-card border text-[14.5px] text-ink-600 placeholder:text-ink-300 outline-none transition-colors",
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-emerald/15 focus:border-emerald/50"
  );
}
