"use client";

import { ArrowLeft, ArrowRight, Check, Lightbulb, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, Question, Segmented, SectionTitle } from "@/components/ui/primitives";
import { DOMAIN_GROUPS, DOMAIN_LABEL, OUT_OF_SCOPE, OUT_OF_SCOPE_LABEL, SCOPE_LABEL, STAGE_LABEL } from "@/content/taxonomy";
import { suggestFromText, type Intake, type StatementRole, type Truth } from "@/engine/intake";
import { newId, type Project } from "@/engine/project";
import { SCOPES, STAGES, type Domain, type Stage } from "@/engine/types";
import { cn } from "@/lib/utils";

const STEPS = 6;
const ROLES: StatementRole[] = ["symptom", "cause", "goal", "impact", "constraint", "context"];
const TRUTHS: Truth[] = ["verified", "unverified", "assumption"];

type Update = (fn: (p: Project) => void, milestone?: string) => void;

export function IntakeView({ project: p, update, onFinish }: { project: Project; update: Update; onFinish: () => void }) {
  const { t, f } = useI18n();
  const step = Math.min(p.intakeStep, STEPS - 1);
  const setIntake = (fn: (i: Intake) => void) => update((x) => fn(x.intake));
  const go = (n: number) => { update((x) => { x.intakeStep = n; }); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div>
      <nav aria-label={f(t.intake.progress, { n: step + 1, total: STEPS })} className="mb-6">
        <p className="mb-3 text-[12.5px] text-ink-subtle">{f(t.intake.progress, { n: step + 1, total: STEPS })}</p>
        <ol className="flex flex-wrap gap-2">
          {t.intake.steps.map((label, i) => (
            <li key={label}>
              <button type="button" onClick={() => go(i)} aria-current={i === step ? "step" : undefined}
                className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] transition-colors",
                  i === step ? "border-primary bg-primary text-primary-fg" : i < step ? "border-primary/30 bg-primary-soft text-primary-soft-fg" : "border-line text-ink-muted hover:border-line-strong")}>
                {i < step ? <Check className="h-3 w-3" aria-hidden /> : <span className="num">{i + 1}</span>}{label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {step === 0 && <StepChallenge p={p} update={update} setIntake={setIntake} />}
      {step === 1 && <StepNeed i={p.intake} setIntake={setIntake} />}
      {step === 2 && <StepArea i={p.intake} setIntake={setIntake} />}
      {step === 3 && <StepKnow i={p.intake} setIntake={setIntake} />}
      {step === 4 && <StepPeople i={p.intake} setIntake={setIntake} />}
      {step === 5 && <StepDetails i={p.intake} setIntake={setIntake} />}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t.common.back}</Button>
        {step < STEPS - 1 ? (
          <Button onClick={() => go(step + 1)}>{t.common.continue}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
        ) : (
          <Button size="lg" onClick={() => { update((x) => { x.intakeDone = true; }, "intake completed"); onFinish(); }}>{t.intake.finish}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
        )}
      </div>
    </div>
  );
}

type SetIntake = (fn: (i: Intake) => void) => void;

function StepChallenge({ p, update, setIntake }: { p: Project; update: Update; setIntake: SetIntake }) {
  const { t, l } = useI18n();
  const sug = useMemo(() => suggestFromText(p.challenge), [p.challenge]);
  const i = p.intake;
  const canApply = (sug.stages.length && !i.stagePrimary) || (sug.domains.length && !i.domains.length);
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle hint={t.intake.challengeLead}>{t.intake.challengeTitle}</SectionTitle>
        <label htmlFor="challenge" className="sr-only">{t.workspace.challenge}</label>
        <textarea id="challenge" className="field min-h-[8rem] text-[15px] leading-relaxed" value={p.challenge} onChange={(e) => update((x) => { x.challenge = e.target.value; })} />
      </Card>
      <Card>
        <SectionTitle hint={t.intake.suggestedHint}><span className="inline-flex items-center gap-2"><Lightbulb className="h-4 w-4 text-gold" aria-hidden />{t.intake.suggested}</span></SectionTitle>
        {sug.stages.length || sug.domains.length ? (
          <>
            <div className="flex flex-wrap gap-2">
              {sug.stages.map((s) => <Badge key={s} tone="gold">{l(STAGE_LABEL[s].label)}</Badge>)}
              {sug.domains.map((d) => <Badge key={d} tone="primary">{l(DOMAIN_LABEL[d])}</Badge>)}
            </div>
            {canApply ? (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setIntake((x) => {
                if (!x.stagePrimary && sug.stages[0]) { x.stagePrimary = sug.stages[0]; x.stageSecondary = sug.stages[1] ?? null; }
                if (!x.domains.length) x.domains = sug.domains.slice(0, 3);
              })}><Check className="h-3.5 w-3.5" aria-hidden />{t.common.confirm}</Button>
            ) : null}
          </>
        ) : <p className="text-[13.5px] text-ink-muted">{t.intake.suggestionsNone}</p>}
      </Card>
      <Card>
        <SectionTitle hint={t.intake.oosHint}>{t.intake.oosTitle}</SectionTitle>
        {sug.outOfScope && i.outOfScope === "none" && <p className="mb-3 rounded-lg bg-warning-soft p-3 text-[13px] text-warning">{t.intake.oosSuggested}</p>}
        <fieldset>
          <legend className="sr-only">{t.intake.oosTitle}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {OUT_OF_SCOPE.map((o) => (
              <label key={o} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-[13.5px]", i.outOfScope === o ? "border-primary bg-primary-soft text-ink" : "border-line text-ink-muted hover:border-line-strong")}>
                <input type="radio" name="oos" className="mt-1 accent-[rgb(var(--primary))]" checked={i.outOfScope === o} onChange={() => setIntake((x) => { x.outOfScope = o; })} />
                {l(OUT_OF_SCOPE_LABEL[o])}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>
    </div>
  );
}

function StepNeed({ i, setIntake }: { i: Intake; setIntake: SetIntake }) {
  const { t, l } = useI18n();
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle hint={t.intake.needLead}>{t.intake.needTitle}</SectionTitle>
        <fieldset>
          <legend className="sr-only">{t.intake.primary}</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s) => {
              const on = i.stagePrimary === s;
              return (
                <label key={s} className={cn("flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors", on ? "border-primary bg-primary-soft" : "border-line hover:border-line-strong")}>
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <input type="radio" name="stage" className="accent-[rgb(var(--primary))]" checked={on} onChange={() => setIntake((x) => { x.stagePrimary = s; if (x.stageSecondary === s) x.stageSecondary = null; })} />
                    {l(STAGE_LABEL[s].label)}
                  </span>
                  <span className="ps-6 text-[12.5px] leading-snug text-ink-muted">{l(STAGE_LABEL[s].hint)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Card>
      {i.stagePrimary && (
        <Card>
          <SectionTitle>{t.intake.secondary}</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Chip on={!i.stageSecondary} onClick={() => setIntake((x) => { x.stageSecondary = null; })}>{t.intake.clearSecondary}</Chip>
            {STAGES.filter((s) => s !== i.stagePrimary).map((s) => (
              <Chip key={s} on={i.stageSecondary === s} onClick={() => setIntake((x) => { x.stageSecondary = s as Stage; })}>{l(STAGE_LABEL[s].label)}</Chip>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Chip({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        on ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink")}>
      {children}
    </button>
  );
}

function StepArea({ i, setIntake }: { i: Intake; setIntake: SetIntake }) {
  const { t, l, f } = useI18n();
  const full = i.domains.length >= 3;
  const toggle = (d: Domain) => setIntake((x) => { x.domains = x.domains.includes(d) ? x.domains.filter((y) => y !== d) : x.domains.length >= 3 ? x.domains : [...x.domains, d]; });
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle hint={t.intake.areaLead}>{t.intake.areaTitle}</SectionTitle>
        {i.domains.length > 0 && (
          <ol className="mb-5 flex flex-wrap gap-2">
            {i.domains.map((d, n) => <li key={d}><Badge tone="primary">{f(t.intake.areaOrder, { n: n + 1 })}: {l(DOMAIN_LABEL[d])}</Badge></li>)}
          </ol>
        )}
        {full && <p className="mb-4 text-[12.5px] text-ink-subtle">{t.intake.areaMax}</p>}
        <div className="space-y-4">
          {DOMAIN_GROUPS.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{l(g.label)}</p>
              <div className="flex flex-wrap gap-2">
                {g.domains.map((d) => {
                  const on = i.domains.includes(d);
                  return <Chip key={d} on={on} disabled={!on && full} onClick={() => toggle(d)}>{on && <span className="num text-[11px]">{i.domains.indexOf(d) + 1}</span>}{l(DOMAIN_LABEL[d])}</Chip>;
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle>{t.intake.scopeTitle}</SectionTitle>
        <Segmented label={t.intake.scopeTitle} value={i.scope} onChange={(v) => setIntake((x) => { x.scope = v; })} options={SCOPES.map((s) => ({ value: s, label: l(SCOPE_LABEL[s]) }))} />
      </Card>
    </div>
  );
}

function StepKnow({ i, setIntake }: { i: Intake; setIntake: SetIntake }) {
  const { t, f } = useI18n();
  return (
    <div className="space-y-6">
      <Card className="bg-surface-2">
        <SectionTitle hint={t.intake.knowLead}>{t.intake.knowTitle}</SectionTitle>
      </Card>
      {ROLES.map((role) => {
        const items = i.statements.filter((s) => s.role === role);
        return (
          <Card key={role} as="section">
            <SectionTitle as="h3" hint={t.intake.rolesHint[role]}>{t.rolesPlural[role]}</SectionTitle>
            <ul className="space-y-3">
              {items.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 rounded-xl border border-line p-3 lg:flex-row lg:items-center">
                  <label className="sr-only" htmlFor={s.id}>{t.roles[role]}</label>
                  <input id={s.id} className="field flex-1" value={s.text} placeholder={t.intake.statementPlaceholder}
                    onChange={(e) => setIntake((x) => { const y = x.statements.find((z) => z.id === s.id); if (y) y.text = e.target.value; })} />
                  <div className="flex items-center gap-2">
                    <Segmented label={t.roles[role]} value={s.truth} onChange={(v) => setIntake((x) => { const y = x.statements.find((z) => z.id === s.id); if (y) y.truth = v; })}
                      options={TRUTHS.map((tr) => ({ value: tr, label: t.truth[tr] }))} />
                    <button type="button" aria-label={t.common.remove} onClick={() => setIntake((x) => { x.statements = x.statements.filter((z) => z.id !== s.id); })}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setIntake((x) => { x.statements.push({ id: newId("s"), role, text: "", truth: role === "cause" ? "assumption" : "unverified" }); })}>
              <Plus className="h-3.5 w-3.5" aria-hidden />{f(t.intake.addStatement, { role: t.roles[role] })}
            </Button>
            {role === "symptom" && items.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-[13px] text-ink-muted">{t.intake.symptomClarity}</span>
                <Segmented label={t.intake.symptomClarity} value={i.symptomClarity} onChange={(v) => setIntake((x) => { x.symptomClarity = v; })}
                  options={[{ value: "concrete", label: t.intake.concrete }, { value: "vague", label: t.intake.vague }]} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ListEditor({ label, placeholder, addLabel, items, onChange }: { label: string; placeholder: string; addLabel: string; items: string[]; onChange: (v: string[]) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <ul className="space-y-2">
        {items.map((v, n) => (
          <li key={n} className="flex gap-2">
            <input aria-label={`${label} ${n + 1}`} className="field" value={v} placeholder={placeholder} onChange={(e) => onChange(items.map((x, k) => (k === n ? e.target.value : x)))} />
            <button type="button" aria-label={t.common.remove} onClick={() => onChange(items.filter((_, k) => k !== n))}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-subtle hover:bg-danger-soft hover:text-danger"><Trash2 className="h-4 w-4" aria-hidden /></button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => onChange([...items, ""])}><Plus className="h-3.5 w-3.5" aria-hidden />{addLabel}</Button>
    </div>
  );
}

function StepPeople({ i, setIntake }: { i: Intake; setIntake: SetIntake }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle>{t.intake.stakeholders}</SectionTitle>
        <ListEditor label={t.intake.stakeholders} placeholder={t.intake.stakeholderPlaceholder} addLabel={t.intake.addStakeholder} items={i.stakeholders} onChange={(v) => setIntake((x) => { x.stakeholders = v; })} />
      </Card>
      <Card>
        <SectionTitle>{t.intake.deadline}</SectionTitle>
        <label htmlFor="deadline" className="sr-only">{t.intake.deadline}</label>
        <input id="deadline" type="date" className="field max-w-xs" value={i.deadline ?? ""} onChange={(e) => setIntake((x) => { x.deadline = e.target.value || null; })} />
      </Card>
      <Card>
        <SectionTitle>{t.intake.options}</SectionTitle>
        <ListEditor label={t.intake.options} placeholder={t.intake.optionPlaceholder} addLabel={t.intake.addOption} items={i.options} onChange={(v) => setIntake((x) => { x.options = v; })} />
      </Card>
    </div>
  );
}

type Tri = "yes" | "no" | "unsure";
const tri = (v: boolean | null): Tri | null => (v === true ? "yes" : v === false ? "no" : null);
const fromTri = (v: Tri): boolean | null => (v === "yes" ? true : v === "no" ? false : null);

function StepDetails({ i, setIntake }: { i: Intake; setIntake: SetIntake }) {
  const { t } = useI18n();
  const [all, setAll] = useState(false);
  const q = t.intake.q;
  const fam = (k: string) => i.domains.some((d) => d.startsWith(k));
  const st = i.stagePrimary;
  const rel = {
    cause: all || st === "FIND_ROOT_CAUSE" || i.statements.some((s) => s.role === "symptom"),
    process: all || fam("OPS") || st === "MAP_CURRENT_STATE" || st === "FIND_ROOT_CAUSE",
    initiative: all || fam("PRJ") || st === "PLAN_EXECUTION" || st === "ALIGN_PEOPLE",
    external: all || fam("STR") || st === "UNDERSTAND_CONTEXT",
    structure: all || fam("ORG") || st === "DESIGN_ORGANISATION",
    threats: all || fam("RSK") || st === "PRIORITISE_DECIDE" || st === "MANAGE_RISK" || i.options.some((o) => o.trim()),
  };
  const yn = [{ value: "yes" as const, label: t.common.yes }, { value: "no" as const, label: t.common.no }, { value: "unsure" as const, label: t.common.unsure }];
  const yn2 = [{ value: "yes" as const, label: t.common.yes }, { value: "no" as const, label: t.common.no }];
  return (
    <Card>
      <SectionTitle hint={t.intake.detailsLead}>{t.intake.detailsTitle}</SectionTitle>
      <div>
        {rel.cause && <Question label={q.recurrence} value={i.recurrence} onChange={(v) => setIntake((x) => { x.recurrence = v; })} options={(["one_off", "recurring", "chronic"] as const).map((v) => ({ value: v, label: q.recurrenceOpts[v] }))} />}
        {rel.cause && <Question label={q.causalComplexity} value={i.causalComplexity ? String(i.causalComplexity) : null} onChange={(v) => setIntake((x) => { x.causalComplexity = Number(v); })} options={q.complexityOpts.map((label, n) => ({ value: String(n + 1), label }))} />}
        {rel.process && <Question label={q.processBoundaries} value={tri(i.processBoundaries)} onChange={(v) => setIntake((x) => { x.processBoundaries = fromTri(v); })} options={yn} />}
        {rel.process && <Question label={q.stepsKnown} value={tri(i.stepsKnown)} onChange={(v) => setIntake((x) => { x.stepsKnown = fromTri(v); })} options={yn} />}
        {rel.process && <Question label={q.measurableSymptom} value={tri(i.measurableSymptom)} onChange={(v) => setIntake((x) => { x.measurableSymptom = fromTri(v); })} options={yn} />}
        {rel.process && <Question label={q.dataAvailable} value={i.dataAvailable} onChange={(v) => setIntake((x) => { x.dataAvailable = v; })} options={(["none", "anecdotal", "some", "good"] as const).map((v) => ({ value: v, label: q.dataOpts[v] }))} />}
        {rel.initiative && <Question label={q.newInitiative} value={i.newInitiative ? "yes" : "no"} onChange={(v) => setIntake((x) => { x.newInitiative = v === "yes"; })} options={yn2} />}
        {rel.external && <Question label={q.externalFocus} value={i.externalFocus ? "yes" : "no"} onChange={(v) => setIntake((x) => { x.externalFocus = v === "yes"; })} options={yn2} />}
        {rel.structure && <Question label={q.structureFocus} value={i.structureFocus} onChange={(v) => setIntake((x) => { x.structureFocus = v; })} options={(["none", "reporting_lines", "delivery_model"] as const).map((v) => ({ value: v, label: q.structureOpts[v] }))} />}
        {rel.threats && <Question label={q.itemsAreThreats} value={i.itemsAreThreats ? "yes" : "no"} onChange={(v) => setIntake((x) => { x.itemsAreThreats = v === "yes"; })} options={yn2} />}
      </div>
      <Button variant="ghost" size="sm" className="mt-4" onClick={() => setAll(!all)}>{all ? t.intake.showRelevant : t.intake.showAllDetails}</Button>
    </Card>
  );
}
