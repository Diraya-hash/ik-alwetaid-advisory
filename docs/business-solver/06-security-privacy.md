# 06: Security & Data Privacy

> **v0.2** (2026-11-19). Changes: reference-source policy per **D1** (§7); KSA in-Kingdom deployment profile (§4.1); authentication wording (L1); data-classification guidance; information-model and Critic integrity controls (§1); phase vocabulary. Changes are marked **[v0.2]**.

Users will describe **sensitive internal business problems**: restructurings, performance issues, compliance gaps. Confidentiality is a precondition for adoption, not an add-on feature.

## 1. Threat model (STRIDE summary)

| Asset | Threat | Control |
|---|---|---|
| Project content (challenges, evidence, artifacts) | Cross-tenant leakage via app bug | RLS backstop (05 §4), tenant-scoped retrieval filters, cross-tenant integration tests, tenant ID in every cache key |
| | Leakage via LLM provider | Commercial API terms (no training on inputs), regional routing, zero-data-retention arrangement where available and required by the customer, PII minimisation (§5) |
| | Leakage via shared link | Org-scoped links by default; public links disabled for enterprise; expiring hashed tokens |
| Model behaviour | Prompt injection via uploaded docs or KB | Untrusted-content wrapping; no tools on content-processing routes; output schema validation; outputs never executed |
| | Data exfiltration through generated links/markdown | Renderers allow-list URL schemes; no remote images in outputs; exports have no external references |
| Accounts | Account takeover | Passwordless (magic link) + Google/Microsoft OIDC; optional WebAuthn passkeys; enterprise MFA enforced via the customer IdP; rate limits on sign-in and link issuance [v0.2] |
| Exports | Malicious OOXML/PDF content | We only *generate*, never execute user templates in MVP. Teams-phase brand templates are sanitised (strip macros/external links) |
| Uploads | Malware, zip bombs, parser exploits | AV scan, size/page limits, sandboxed extraction worker (no network, read-only FS, seccomp), MIME sniffing |
| Audit | Repudiation / tampering | Hash-chained audit log shipped to an external SIEM |
| Information integrity [v0.2] | AI or a bug silently upgrades an assumption to a verified fact, or alters approved content | DB-level guard: `truth_status_changed` events only with `actor_type = user`; AI output schemas exclude `verified`; Critic accepts applied only as user-authored versions; statement history append-only (03 §3.2) |
| Reference-source leakage [v0.2] | Third-party copyrighted text reaches prompts, outputs or exports | `kb_internal` schema with no API/worker grants; restricted bucket with access logging; CI check that no prompt template or KB entry contains reference-source text (n-gram overlap scan) |
| Availability | Cost-exhaustion via AI abuse | Per-user/org rate limits and AI budgets; anomaly alerts on token spend |

## 2. Identity & access (DR-20)

- **Authentication:** OIDC sessions (httpOnly, Secure, SameSite=Lax cookies; short-lived access JWT + rotating refresh). Email magic link + Google/Microsoft for SMB.
- **Enterprise SSO:** SAML 2.0 / OIDC and SCIM 2.0 via a **managed identity broker** (e.g. WorkOS-class) in SaaS. **Keycloak** in sovereign/on-prem deployments, behind the same internal `IdentityProvider` interface. *Rationale:* SAML edge cases are a time sink; brokers handle per-customer IdP quirks. *Alternative:* building SAML ourselves on a library is rejected (security risk, maintenance cost).
- **Authorisation:** RBAC (org: owner/admin/member/guest; workspace: admin/editor/commenter/viewer) plus resource shares. Checks are centralised in `platform/acl` with policy-as-code tests. The Enterprise phase may adopt a relationship-based engine (OpenFGA-style) if sharing gets complex.
- **Admin actions** (role changes, exports of all data, SSO config) need step-up re-authentication and are audit-logged.

## 3. Data protection

| Layer | Control |
|---|---|
| In transit | TLS 1.2+ (1.3 preferred) everywhere, HSTS; internal service traffic over TLS inside VPC |
| At rest | AES-256 on DB storage, backups and object storage (KMS). Enterprise: **customer-managed keys (BYOK)** |
| Field-level | Evidence files and AI-run payloads encrypted with a **per-org data key** (envelope encryption). Deleting the key crypto-shreds residual copies |
| Secrets | Cloud secrets manager; rotation; no secrets in repo or images; CI secret scanning |
| Signed URLs | Deliverable downloads via short-lived (5 min) signed URLs bound to the user session |

## 4. Data residency & sovereignty

- `organisations.data_region` pins the **whole data plane**: DB, object storage, worker, logs and backups.
- **The model-inference region is part of residency.** The Model Gateway routes each tenant to a provider endpoint (Anthropic API, AWS Bedrock or Google Vertex AI) whose processing location satisfies the tenant's policy. Regional availability of specific models changes over time, so it is **verified at contract time** and encoded as a tenant policy the gateway enforces (it fails closed if no compliant route exists).
- **GCC focus:** design to meet KSA **PDPL** and UAE **PDPL** requirements (lawful basis, cross-border transfer conditions, data-subject rights, breach notification), plus sector regulators (e.g. NCA ECC controls for government-sector customers in KSA). Formal legal review is a Phase 0 task. **This document is not legal advice.**
- EU customers: GDPR (DPA, SCCs, sub-processor list, DPIA template).

### 4.0 API credentials for model access [2026-11-21]
Model API keys are handled per doc 14 §4:
- **Phase 0 evaluation:** a dedicated workspace key with a spend limit, held only as a reviewer-gated GitHub Actions *environment secret* (`phase0-eval`).
- **Production:** keys in the cloud secrets manager, injected into the Model Gateway at runtime (02 §4.1).
- **Never** in source, `.env` files in the repo, logs, results, chat, or shared environments.

Controls: redaction in the gateway, a secret scanner over files and full git history, a pre-commit hook, and CI scans of results before commit.

### 4.1 KSA in-Kingdom option [v0.2]

The architecture supports a **`ksa-sovereign` deployment profile** (02 §7.1): data plane in-Kingdom, inference only via an in-Kingdom compliant route, Model Gateway failing closed, content-free telemetry only. Before offering it to a customer:
1. Confirm an in-Kingdom inference route (provider endpoint hosted in KSA, or an approved self-hosted model) and run the full eval suite on that route.
2. Map controls to applicable requirements (e.g. NCA ECC / cloud controls for government entities, PDPL, sector regulators). Formal legal and compliance review is required; this document is not legal advice.
3. Agree the data-classification ceiling with the customer. The product is not designed for classified ("secret"/"top secret") government data in any profile.

**Data-classification guidance for all profiles [v0.2].** Onboarding and the composer show a short notice: *"Don't enter classified information or personal data you are not permitted to share."* Org admins can set a `data_classification_max` that the Gateway policy enforces.

## 5. Privacy by design for AI

1. **Minimise what goes to the model.** Send only what the route needs: the diagnosis route gets the conversation and top-k evidence chunks, not whole files.
2. **PII detection** on input (regex + NER for names, national IDs, IBANs, phone numbers, emails; AR and EN patterns). Behaviour depends on org policy:
   - `warn` (default SMB): highlight it and suggest generalising ("Ahmed in finance" → "a finance officer").
   - `redact` (enterprise option): replace with stable placeholders (`[PERSON_1]`) before the model call and rehydrate in the UI only. The placeholder map stays server-side.
   - `block`: refuse submissions containing certain classes (e.g. national ID numbers).
3. **No training on customer data**, contractually (provider terms) and internally. Eval sets use customer data only with written consent.
4. **Prompt and response storage is minimal** (05 §5): validated outputs are kept for history, and raw prompt payloads are off by default.
5. **Transparency:** an in-product "How AI is used" page; an AI-generated-content disclosure on exports (default on); claim typing shows users exactly what is AI-suggested.
6. **Human in control:** AI output is always a *suggestion* until accepted. Nothing is published or sent externally automatically.

## 6. Responsible-use boundaries

- **No evaluation of named individuals.** The product will not rank, score or recommend action on identifiable people (performance, termination, discipline). Org charts are about **roles and structure**. Names are optional display labels, and PII policy applies to them.
- **No legal, medical or financial-investment advice.** These are out of scope (04 §7) and answered with a pointer to the right professional plus the business-side framing.
- **Bias awareness:** stakeholder and org-design suggestions avoid demographic attributes. Critique prompts flag blame-oriented root causes ("lazy staff") and steer toward system causes.

## 7. Intellectual property & source attribution

| Topic | Policy |
|---|---|
| Reference PDF ("50 Business Diagrams for Strategic Planning", © Cinergix Pty Ltd, all rights reserved) [v0.2, D1] | **Internal editorial reference only.** Not ingested into the product KB, not placed in prompts, not quoted, not cited in the UI or exports. Its diagrams, wording, templates and distinctive visual designs are **never reproduced**. Its content is not published, redistributed or used to create derivative commercial content without permission. Stored in a restricted bucket; consultation recorded internally (`kb_internal.reference_mappings`). **The product has no legal or technical dependency on it** |
| Our visualisations | Independently designed renderers implementing **generic methodology conventions** (2×2 grids, fishbone spine, swimlanes, Gantt bars), which are not themselves protectable. Visual identity (colours, shapes, typography, layout details) is ours. Design reviews include a "no look-alike" check against known commercial templates. **[v0.2]** Every renderer and slide template passes a design review against the reference PDF and known commercial templates before release |
| Attribution in UI/exports [v0.2] | Methodology **originators** (public knowledge, SME-verified) and platform authorship ("Business Problem Solver methodology notes"). User evidence is cited with file and page. Licensed third-party sources are cited only after legal approval. AI content is labelled through the information model |
| Framework names & trademarks | Methodology names are used descriptively. Trademarked notations (e.g. BPMN is an OMG specification) are referenced accurately; our BPMN is a documented *subset* |
| Customer content | Customers own their inputs and outputs. Licence to process only for service delivery |

## 8. Application security programme

- **SDLC:** threat-model review per epic; mandatory code review; SAST (Semgrep), dependency scanning (OSV/Dependabot), container scanning, IaC scanning, secret scanning; SBOM per release.
- **Web:** strict CSP (the simulator already ships a CSP-enforced E2E; reuse it), CSRF protection on cookie-auth mutations, output encoding, rich text from a sanitised allow-list (DOMPurify server and client), SSRF-safe fetchers (no user-supplied URLs fetched server-side in MVP).
- **API:** schema validation on every input (Zod), per-route rate limits, idempotency keys on POSTs that create jobs, pagination caps, uniform error envelopes (no stack traces).
- **LLM-specific:** OWASP Top 10 for LLM Applications checklist per release; red-team prompt-injection suite (AR + EN) in CI evals; output validators treat model output as untrusted input.
- **Testing:** pen test before GA and annually; bug-bounty after GA.
- **Operations:** centralised logs with PII scrubbing; security alerts (impossible travel, mass export, privilege change); incident response runbook with breach-notification timelines per jurisdiction (KSA/UAE/EU); RPO ≤ 15 min, RTO ≤ 4 h (enterprise tier: RPO 5 min, RTO 1 h).

## 9. Compliance roadmap

| Milestone | Target |
|---|---|
| Privacy policy (AR/EN), DPA, sub-processor list, AI use disclosure | Before Beta-1 users |
| PDPL (KSA/UAE) and GDPR readiness assessment | Phase 0 – Beta-1 |
| SOC 2 Type I (or ISO 27001 Stage 1) | Enterprise |
| SOC 2 Type II / ISO 27001 certification; ISO 42001 (AI management) gap analysis | Scale |
| Sector-specific (e.g. NCA ECC for KSA gov) | On first qualifying enterprise deal |
