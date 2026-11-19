# 05: Database Architecture

> **v0.2** (2026-11-19). Changes: statement events (D2); critique tables (D3); option sets as artifacts (D4); internal-only reference sources (D1); translated versions; checkpoint versioning (M4); derived projections (M5); billing and entitlements (H13); demand signals; country/workweek settings (M6); embeddings deferred (DR-09 amended); deployment profile column. Changes are marked **[v0.2]**.

## 1. Choices (DR-14, DR-15, DR-16)

| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Engine | **PostgreSQL 16** + `pg_trgm` + built-in FTS + `pgcrypto` (+ `pgvector` installed but **unused in MVP** [v0.2]) | One transactional store for relational data, flexible JSONB artifacts, vectors and text search. One backup/restore/residency story. RLS for tenant isolation | Mongo (weak relational integrity for ACL/history). Separate vector DB (second store to secure and replicate) |
| Tenancy | **Shared schema, `org_id` on every tenant row, Row-Level Security** enforced with `SET LOCAL app.org_id` per transaction. **Dedicated database** (same schema) for enterprise single-tenant | Cheap for SMB. RLS gives defence-in-depth against app-layer bugs. Same code path for dedicated deployments | Schema-per-tenant (migration fan-out pain at 1000s of tenants). DB-per-tenant for all (cost) |
| Artifact history | **Append-only `artifact_versions`** (full snapshot + RFC 6902 patch + author + ai_run), with `artifacts.current_version` pointer | O(1) reads of any version, simple restore, easy diff, auditable | Full event sourcing (replay complexity, no benefit for document-like data). Temporal tables (poor JSON diff ergonomics) |
| IDs | Prefixed ULIDs stored as `text` (`prj_01J…`) | Sortable, URL-safe, debuggable; the prefix tells you the type | UUIDv4 (unsortable), bigserial (leaks counts, conflicts across regions) |
| Text | Store bilingual fields as `jsonb {"ar": "...", "en": "..."}` for catalogue content. User content stored in its original language with a `language` column | Clean for KB. User data isn't duplicated | Separate translation tables (overkill for 2 locales) |

## 2. Schemas (Postgres namespaces = module ownership)

```
iam         organisations, users, memberships, workspaces, workspace_members, api_keys, sso_connections
workspace   projects, conversations, messages, artifacts, artifact_versions, statement_events [v0.2],
            framework_instances, instance_links, evidence_files, deliverables, comments, shares, activity_log,
            critique_runs, critique_findings, critique_finding_events [v0.2]
kb          knowledge_entries, chunks, frameworks, framework_definitions, taxonomy_nodes, slots [v0.2],
            port_types [v0.2], affinity_edges, glossary_terms
kb_internal reference_sources, reference_mappings [v0.2: content-team only; no API role has access]
ai          ai_runs, prompt_versions, feedback, demand_signals [v0.2], eval_runs, eval_results
billing     plans, plan_entitlements, subscriptions, invoices, payment_events [v0.2]
ops         jobs (pg-boss), usage_events, audit_log, feature_flags, retention_policies
```

Each module only writes to its own schema. Cross-module reads go through module services, enforced by DB roles: `api_workspace` cannot write `kb.*` except via the KB admin path.

## 3. Core DDL (abridged; executable form lives in `apps/bps-api/migrations`)

### 3.1 IAM

```sql
create table iam.organisations (
  id text primary key,                         -- org_…
  name text not null,
  plan text not null default 'free',           -- free|pro|team|enterprise
  data_region text not null default 'primary', -- residency pin
  deployment_profile text not null default 'global' check (deployment_profile in ('global','gcc','ksa-sovereign')), -- [v0.2] 02 §7.1
  country char(2),                              -- [v0.2] ISO 3166; drives workweek/calendar defaults
  settings jsonb not null default '{}',        -- numerals, calendar, workweek [v0.2], gate τ, PII mode, AI disclosure, retention, inference_policy [v0.2]
  ai_budget_monthly_usd numeric(10,2),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table iam.users (
  id text primary key,                         -- usr_…
  email citext unique not null,
  display_name text,
  locale text not null default 'ar' check (locale in ('ar','en')),
  idp_subject text, idp_provider text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table iam.memberships (
  org_id text references iam.organisations(id),
  user_id text references iam.users(id),
  role text not null check (role in ('owner','admin','member','guest')),
  primary key (org_id, user_id)
);

create table iam.workspaces (
  id text primary key, org_id text not null references iam.organisations(id),
  name text not null, brand_template_id text, created_at timestamptz default now()
);
create table iam.workspace_members (
  workspace_id text references iam.workspaces(id), user_id text references iam.users(id),
  org_id text not null,
  role text not null check (role in ('admin','editor','commenter','viewer')),
  primary key (workspace_id, user_id)
);
```

### 3.2 Projects, conversations, messages

```sql
create table workspace.projects (
  id text primary key,                          -- prj_…
  org_id text not null, workspace_id text not null references iam.workspaces(id),
  owner_id text not null references iam.users(id),
  title text not null,
  language text not null check (language in ('ar','en')),
  workflow_state text not null default 'DRAFT',
  taxonomy_codes text[] not null default '{}',  -- denormalised for filtering
  framework_ids text[] not null default '{}',
  status text not null default 'active' check (status in ('active','archived','deleted')),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  deleted_at timestamptz,
  search tsvector                                 -- title + reframed statement (normalised)
);
create index on workspace.projects (org_id, workspace_id, updated_at desc);
create index on workspace.projects using gin (taxonomy_codes);
create index on workspace.projects using gin (search);

create table workspace.conversations (
  id text primary key, org_id text not null, project_id text not null references workspace.projects(id),
  created_at timestamptz default now()
);

create table workspace.messages (
  id text primary key, org_id text not null,
  conversation_id text not null references workspace.conversations(id),
  role text not null check (role in ('user','assistant','system_event')),
  content jsonb not null,             -- {text, attachments[], ui_event?}
  language text,
  pii_flags text[] default '{}',
  ai_run_id text,
  created_at timestamptz default now()
);
create index on workspace.messages (conversation_id, created_at);
```

### 3.3 Artifacts and versions (the history backbone)

```sql
create table workspace.artifacts (
  id text primary key,                          -- art_…
  org_id text not null, project_id text not null references workspace.projects(id),
  kind text not null check (kind in ('challenge','diagnosis','recommendation_set','framework_instance',
                                     'option_set','ps_summary',            -- [v0.2]
                                     'narrative','deliverable_spec')),
  schema_id text not null,                      -- e.g. 'ai/problem-diagnosis.v1', 'fw/instance.v1'
  current_version int not null default 1,
  state text not null default 'active' check (state in ('active','stale','superseded','deleted')),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table workspace.artifact_versions (
  artifact_id text references workspace.artifacts(id),
  version int not null,
  org_id text not null,
  parent_version int,
  content jsonb not null,                       -- full snapshot (validated against schema_id)
  patch jsonb,                                  -- RFC 6902 from parent (null for v1)
  author_type text not null check (author_type in ('user','ai','system')),
  author_id text,                               -- user id when author_type='user'
  ai_run_id text,                               -- when author_type='ai'
  change_summary text,
  checkpoint_reason text check (checkpoint_reason in ('step_complete','explicit_save','ai_run','critic_accept',
                     'navigate_away','export','time_5min','restore','translation')),     -- [v0.2] M4
  language text not null default 'ar' check (language in ('ar','en')),             -- [v0.2]
  translation_of jsonb,                         -- [v0.2] {artifact_id, version} when this version is a translation
  translation_status text check (translation_status in ('unreviewed','reviewed','stale')), -- [v0.2]
  layout_hash text,                             -- [v0.2] canonical LaidOutDiagram stored in object storage (02 §6.4a)
  created_at timestamptz default now(),
  primary key (artifact_id, version)
);
-- Append-only: revoke update/delete from app roles; restores create a new version.
-- [v0.2] Versions are written at checkpoints only; between checkpoints the client keeps a local draft (IndexedDB).
```

### 3.3a Statement events (modification history, D2) [v0.2]

Statements live inside artifact content (JSONB) for O(1) reads. Their **change history is also indexed** so the history panel, the Critic and audits can query it without diffing snapshots.

```sql
create table workspace.statement_events (
  id bigserial primary key, org_id text not null, project_id text not null,
  artifact_id text not null, artifact_version int not null,
  statement_id text not null,                   -- st_…
  at timestamptz not null default now(),
  actor_type text not null check (actor_type in ('user','ai','system')), actor_id text,
  action text not null check (action in ('created','text_edited','truth_status_changed','decision_status_changed',
         'review_accepted','review_rejected','evidence_added','evidence_removed','challenged','translated','restored')),
  field text, from_value jsonb, to_value jsonb, reason text,
  critic_finding_id text
);
create index on workspace.statement_events (statement_id, at);
create index on workspace.statement_events (project_id, at desc);
-- Trigger-free: written by the Workspace module in the same transaction as the artifact version.
-- Guard (app + DB check function): truth_status_changed rows require actor_type='user' (03 §3.2, I1–I2).
```

Optimistic concurrency: `POST /versions {base_version}` runs inside a tx with `select current_version … for update`. A mismatch returns **409** with the server's latest version so the client can rebase. JSON Patch on disjoint paths auto-merges; overlapping paths go to the user.

### 3.4 Framework instances (projection for querying)

```sql
create table workspace.framework_instances (
  id text primary key,                         -- fwi_… (= artifact id of kind framework_instance)
  org_id text not null, project_id text not null,
  artifact_id text not null references workspace.artifacts(id),
  framework_id text not null, definition_version text not null,
  chain_id text, chain_position int,
  step_state jsonb not null default '{}',       -- [v0.2] DERIVED from the current artifact version, in the same tx (M5)
  active_view text,                             -- [v0.2] e.g. 'action_table' | 'gantt'
  mode text not null default 'consultant' check (mode in ('consultant','workshop')),   -- [v0.2]
  validation_status text not null default 'incomplete', -- incomplete|warnings|valid
  upstream_changed boolean not null default false,       -- [v0.2]
  completed_at timestamptz
);
-- [v0.2] This table is a query projection only. The artifact version is the single source of truth;
-- the projection is rebuilt from it on every commit and can be regenerated at any time.
create table workspace.instance_links (          -- port bindings for chaining
  from_instance text, from_version int, from_port text,
  to_instance text, to_port text, org_id text not null,
  primary key (from_instance, from_port, to_instance, to_port)
);
```

### 3.5 Evidence and deliverables

```sql
create table workspace.evidence_files (
  id text primary key, org_id text not null, project_id text not null,
  filename text not null, mime text not null, bytes bigint not null,
  storage_key text not null,                   -- s3 key, encrypted at rest (SSE-KMS)
  sha256 text not null,
  status text not null check (status in ('uploaded','scanning','extracting','ready','rejected','purged')),
  pii_summary jsonb, uploaded_by text not null, created_at timestamptz default now()
);

create table workspace.deliverables (
  id text primary key, org_id text not null, project_id text not null,
  format text not null check (format in ('pptx','pdf','png','svg','docx','xlsx')),
  language text not null, template_id text,
  spec jsonb not null,                         -- pinned {artifact_id, version}[] + options
  manifest jsonb,                              -- embedded provenance manifest
  storage_key text, bytes bigint,
  status text not null check (status in ('queued','rendering','ready','failed','expired')),
  error jsonb, requested_by text not null,
  created_at timestamptz default now(), completed_at timestamptz
);
```

### 3.6 Knowledge base

```sql
-- [v0.2, D1] Reference sources are INTERNAL ONLY: separate schema, no grants to api/worker roles.
create schema kb_internal;
create table kb_internal.reference_sources (
  id text primary key, title text not null, rights_holder text not null,
  rights_status text not null check (rights_status in ('all_rights_reserved','licensed','open_licence','public_domain')),
  use_status text not null default 'internal_reference_only'
             check (use_status in ('internal_reference_only','citable_source','retired')),
  licence_terms text, page_count int, page_offset int,
  storage_key text not null, sha256 text not null,          -- restricted bucket, access audit-logged
  legal_review jsonb, recorded_by text not null, recorded_at timestamptz not null default now()
);
create table kb_internal.reference_mappings (
  framework_id text not null, variant text, reference_source_id text references kb_internal.reference_sources(id),
  entry_no int, entry_title text not null, printed_page int not null, pdf_page int not null,
  consulted_for text[] not null default '{}', notes text,
  primary key (framework_id, reference_source_id, entry_title)
);
revoke all on schema kb_internal from api_role, worker_role;   -- content-team role only

create table kb.frameworks (
  id text primary key, slug text unique not null,           -- [v0.2] catalogue_no removed (H1)
  names jsonb not null, status text not null, family text not null,
  meta jsonb not null,                          -- full fw/framework.v1 document
  active_definition_version text,
  updated_at timestamptz default now()
);
create table kb.framework_definitions (
  framework_id text references kb.frameworks(id), version text,
  definition jsonb not null, published_at timestamptz, published_by text,
  primary key (framework_id, version)
);

create table kb.knowledge_entries (
  id text primary key, framework_id text references kb.frameworks(id),
  section_type text not null, version int not null,
  body jsonb not null,                          -- {en, ar} markdown
  provenance text not null check (provenance in ('platform_authored','ai_drafted_reviewed','org_authored')), -- [v0.2]
  review jsonb, status text not null
);

create table kb.chunks (
  id text primary key,
  corpus text not null check (corpus in ('platform_kb','org_kb','project_evidence')),   -- [v0.2]
  org_id text, project_id text,                 -- null for global
  origin jsonb not null,                        -- 03 §2.1
  language text not null,
  text text not null, text_normalised text not null,
  locator jsonb not null default '{}',
  section_type text, framework_ids text[] default '{}', taxonomy_codes text[] default '{}',
  token_count int,
  fts tsvector generated always as (to_tsvector('simple', text_normalised)) stored,
  content_hash text not null,
  active boolean not null default true
);
-- [v0.2] No embedding column in MVP (DR-09 amended). When activated, embeddings go in a per-model table
-- (L2), so models can be swapped and corpora re-embedded side by side:
--   create table kb.chunk_embeddings_<model> (chunk_id text references kb.chunks(id), embedding vector(<dim>), primary key (chunk_id));
--   + hnsw index (vector_cosine_ops)
create index chunks_fts on kb.chunks using gin (fts);
create index chunks_filter on kb.chunks (corpus, org_id, project_id) where active;
create index chunks_fw on kb.chunks using gin (framework_ids);

create table kb.taxonomy_nodes (code text primary key, version text not null, parent text, axis text not null, node jsonb not null);
create table kb.affinity_edges (
  framework_id text references kb.frameworks(id), dimension text not null,  -- 'domain'|'stage'|'nature'
  key text not null, weight numeric(4,3) not null, source text not null default 'seed', -- seed|tuned
  version text not null, primary key (framework_id, dimension, key, version)
);
create table kb.glossary_terms (id text primary key, en text not null, ar text not null, do_not_translate boolean default false, notes text);
-- [v0.2] Registries are versioned files in the repo, mirrored here for queries/admin UI:
create table kb.slots (id text primary key, version text not null, pointer text not null, type text not null, def jsonb not null);
create table kb.port_types (id text primary key, version text not null, item_schema jsonb not null);
```

### 3.7 AI runs, feedback, evals

```sql
create table ai.ai_runs (
  id text primary key,                         -- run_…
  org_id text, project_id text, user_id text,
  route text not null, prompt_id text not null, prompt_version text not null,
  provider text not null, model text not null, effort text,
  input_hash text not null,                    -- sha256 of rendered prompt (prompt text itself stored per retention policy)
  input_ref text,                              -- object-storage key of the redacted prompt payload (optional; retention-bound)
  output jsonb,                                -- validated output (or null on failure)
  validation jsonb,                            -- errors, downgrades, repair attempts
  stop_reason text, refusal_category text,
  tokens_in int, tokens_out int, tokens_cache_read int, tokens_cache_write int,
  cost_usd numeric(10,5), latency_ms int,
  created_at timestamptz default now()
);
create index on ai.ai_runs (org_id, created_at desc);
create index on ai.ai_runs (route, prompt_version);

create table ai.feedback (
  id text primary key, org_id text not null, user_id text not null,
  target_type text not null,                   -- recommendation|element|diagnosis|deliverable
  target_id text not null, target_version int,
  rating smallint check (rating in (-1, 1)), reason_code text, comment text,
  created_at timestamptz default now()
);

create table ai.eval_runs (id text primary key, suite text, git_sha text, prompt_versions jsonb, config jsonb, started_at timestamptz, summary jsonb);
create table ai.eval_results (eval_run_id text references ai.eval_runs(id), case_id text, metrics jsonb, output jsonb, primary key (eval_run_id, case_id));
```

### 3.8 Collaboration and audit

```sql
create table workspace.comments (id text primary key, org_id text not null, artifact_id text not null, artifact_version int,
  json_pointer text, author_id text not null, body text not null, resolved boolean default false, created_at timestamptz default now());
create table workspace.shares (id text primary key, org_id text not null, project_id text not null,
  scope text check (scope in ('org_link','invite')), role text check (role in ('viewer','commenter','editor')),
  token_hash text, expires_at timestamptz, created_by text not null);
create table workspace.activity_log (id bigserial primary key, org_id text not null, project_id text,
  actor_id text, action text not null, target text, meta jsonb, at timestamptz default now());

create table ops.audit_log (                    -- security-relevant, append-only, also shipped to SIEM
  id bigserial primary key, org_id text, actor_id text, actor_ip inet, action text not null,
  resource text, outcome text, meta jsonb, at timestamptz default now(),
  prev_hash text, row_hash text                 -- hash chain for tamper evidence
);
```

### 3.9 Metering

```sql
create table ops.usage_events (
  id bigserial primary key, org_id text not null, user_id text,
  kind text not null,            -- ai_tokens|analysis_completed|export|storage_bytes|seat_active
  quantity numeric not null, unit text not null, cost_usd numeric(10,5),
  ref text, at timestamptz default now()
);
create index on ops.usage_events (org_id, at);
```

Designed for any pricing model (Q2 in 01 §10): seats, per-analysis or token pass-through can all be derived from this table.

### 3.10 Critic (D3) [v0.2]

```sql
create table workspace.critique_runs (
  id text primary key, org_id text not null, project_id text not null,
  level text not null check (level in ('item','framework','project')),
  target jsonb not null,                        -- [{artifact_id, version}] reviewed (pinned)
  trigger text not null check (trigger in ('edit','step_complete','on_demand','pre_handoff','pre_export')),
  rubric_id text, ai_run_id text,
  status text not null check (status in ('queued','running','done','failed')),
  summary jsonb,                                -- counts by severity/category
  requested_by text, created_at timestamptz default now(), completed_at timestamptz
);
create table workspace.critique_findings (
  id text primary key, org_id text not null, project_id text not null,
  run_id text not null references workspace.critique_runs(id),
  level text not null, severity text not null check (severity in ('critical','high','medium','low')),
  category text not null, source text not null check (source in ('rule','ai')), rule_id text,
  target jsonb not null,                        -- {artifact_id, artifact_version, statement_ids[], json_pointer}
  title text not null, explanation text not null,                 -- required (D3)
  suggested_correction jsonb not null,                            -- required (D3): {type, proposal, patch?}
  evidence_refs jsonb not null default '[]',
  status text not null default 'open' check (status in ('open','accepted','rejected','dismissed','resolved','acknowledged')),
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index on workspace.critique_findings (project_id, status, severity);
create table workspace.critique_finding_events (       -- review history, append-only
  id bigserial primary key, org_id text not null, finding_id text not null references workspace.critique_findings(id),
  at timestamptz default now(), actor_type text not null, actor_id text,
  action text not null check (action in ('created','accepted','rejected','dismissed','resolved','acknowledged','reopened')),
  reason text, resulting_version jsonb             -- {artifact_id, version} when accept applied a patch
);
```
Rule (enforced in the Critic module): `accepted` applies the patch **as a new user-authored version** through the Workspace module. Findings never write to artifacts directly.

### 3.11 Demand signals [v0.2]

```sql
create table ai.demand_signals (
  id bigserial primary key, org_id text, project_id text,
  kind text not null check (kind in ('no_good_fit','recommendation_rejected','manual_library_search')),
  taxonomy_codes text[], stage text, slots jsonb, query text, at timestamptz default now()
);
```
Content-free aggregates drive the order in which pending catalogue methods are activated (03 §7.3).

### 3.12 Billing and entitlements (H13) [v0.2]

```sql
create table billing.plans (id text primary key, name jsonb not null, interval text check (interval in ('month','year')),
  currency char(3) not null default 'SAR', price_minor int,            -- NULL until pricing is decided
  active boolean not null default false);
create table billing.plan_entitlements (plan_id text references billing.plans(id), key text not null,
  value jsonb not null, primary key (plan_id, key));   -- e.g. analyses_per_month, exports, projects, features[]
create table billing.subscriptions (id text primary key, org_id text not null, plan_id text not null,
  seats int not null default 1, status text not null check (status in ('trialing','active','past_due','cancelled')),
  current_period_start timestamptz, current_period_end timestamptz, gateway_ref text);
create table billing.invoices (id text primary key, org_id text not null, subscription_id text,
  number text unique not null, issued_at timestamptz not null, currency char(3) not null,
  subtotal_minor int not null, vat_rate numeric(5,4) not null, vat_minor int not null, total_minor int not null,
  buyer jsonb not null,                       -- name, VAT number, address (Arabic + Latin)
  zatca jsonb,                                -- e-invoice UUID, hash, QR payload, clearance/reporting status
  pdf_storage_key text);
create table billing.payment_events (id bigserial primary key, org_id text, gateway text not null,
  event_type text not null, payload_hash text not null, at timestamptz default now());   -- raw payloads not stored
```
Entitlement checks are server-side, read from the plan + usage counters. No price is stored or shown until pricing is approved (`price_minor` NULL, `active = false`).

## 4. Row-Level Security

```sql
alter table workspace.projects enable row level security;
create policy tenant_isolation on workspace.projects
  using (org_id = current_setting('app.org_id', true))
  with check (org_id = current_setting('app.org_id', true));
-- identical policy on every table carrying org_id; kb.chunks policy:
create policy kb_visibility on kb.chunks using (
  corpus = 'platform_kb'
  or (corpus in ('org_kb','project_evidence') and org_id = current_setting('app.org_id', true))
);
```

- The API sets `SET LOCAL app.org_id = $1` (and `app.user_id`) at the start of each transaction from the verified session. The connection-pool role is **not** a superuser and has `NOBYPASSRLS`.
- **Project-level ACL** (workspace membership, shares) is enforced in the application ACL module, with RLS as the tenant-level backstop. Integration tests assert that cross-org reads return zero rows even when the app-level check is skipped.

## 5. Retention, deletion, backup

| Data | Default retention | Notes |
|---|---|---|
| Projects/artifacts | Until user deletes; soft delete 30 days → hard purge job | Enterprise: org policy |
| Evidence files | Project lifetime; purge on project hard-delete | Crypto-shredding option: per-org data key (06 §3) |
| `ai_runs.output` / metadata | 13 months | Needed for audit and evals |
| Raw prompt payloads (`input_ref`) | **Off by default**; 30 days if the org opts in for debugging | Minimises stored copies of user content |
| Audit log | 2 years (configurable up to 7) | Immutable |
| Statement events, critique runs/findings/events [v0.2] | Same as the parent project | Review history is part of the project record; exported in the manifest summary |
| Invoices & payment events [v0.2] | Per KSA VAT/ZATCA record-keeping obligations (period to be confirmed by tax adviser) | Survive project/user deletion as legally required records |
| Backups | PITR 14 days; daily snapshots 35 days, encrypted, same region | Restore drill quarterly |

**Right-to-erasure:** the `purge` job deletes user-owned rows across schemas, evidence objects, deliverables, chunks (`project_evidence`) and AI-run payloads, and writes an erasure certificate to the audit log. Backups age out within 35 days (documented in the DPA).

## 6. Scaling path

| Trigger | Action |
|---|---|
| > 5k QPS reads | Read replicas for list/search endpoints |
| `kb.chunks` > 20M rows or vector p95 > 150 ms | Partition `chunks` by corpus/org hash; consider dedicated vector service |
| `ai_runs` growth | Monthly range partitions; move > 90-day partitions to cheaper storage |
| Enterprise single-tenant | Same migrations against a dedicated cluster; RLS still on |
