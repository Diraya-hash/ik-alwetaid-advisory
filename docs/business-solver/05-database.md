# 05: Database Architecture

## 1. Choices (DR-14, DR-15, DR-16)

| Decision | Choice | Rationale | Alternatives rejected |
|---|---|---|---|
| Engine | **PostgreSQL 16** + `pgvector` (HNSW) + `pg_trgm` + built-in FTS + `pgcrypto` | One transactional store for relational data, flexible JSONB artifacts, vectors and text search. One backup/restore/residency story. RLS for tenant isolation | Mongo (weak relational integrity for ACL/history). Separate vector DB (second store to secure and replicate) |
| Tenancy | **Shared schema, `org_id` on every tenant row, Row-Level Security** enforced with `SET LOCAL app.org_id` per transaction. **Dedicated database** (same schema) for enterprise single-tenant | Cheap for SMB. RLS gives defence-in-depth against app-layer bugs. Same code path for dedicated deployments | Schema-per-tenant (migration fan-out pain at 1000s of tenants). DB-per-tenant for all (cost) |
| Artifact history | **Append-only `artifact_versions`** (full snapshot + RFC 6902 patch + author + ai_run), with `artifacts.current_version` pointer | O(1) reads of any version, simple restore, easy diff, auditable | Full event sourcing (replay complexity, no benefit for document-like data). Temporal tables (poor JSON diff ergonomics) |
| IDs | Prefixed ULIDs stored as `text` (`prj_01J…`) | Sortable, URL-safe, debuggable; the prefix tells you the type | UUIDv4 (unsortable), bigserial (leaks counts, conflicts across regions) |
| Text | Store bilingual fields as `jsonb {"ar": "...", "en": "..."}` for catalogue content. User content stored in its original language with a `language` column | Clean for KB. User data isn't duplicated | Separate translation tables (overkill for 2 locales) |

## 2. Schemas (Postgres namespaces = module ownership)

```
iam        organisations, users, memberships, workspaces, workspace_members, api_keys, sso_connections
workspace  projects, conversations, messages, artifacts, artifact_versions, framework_instances,
           evidence_files, deliverables, comments, shares, activity_log
kb         source_documents, source_versions, knowledge_entries, chunks, frameworks,
           framework_definitions, taxonomy_nodes, affinity_edges, glossary_terms
ai         ai_runs, prompt_versions, feedback, eval_runs, eval_results
ops        jobs (pg-boss), usage_events, audit_log, feature_flags, retention_policies
```

Each module only writes to its own schema. Cross-module reads go through module services, enforced by DB roles: `api_workspace` cannot write `kb.*` except via the KB admin path.

## 3. Core DDL (abridged; executable form lives in `apps/studio-api/migrations`)

### 3.1 IAM

```sql
create table iam.organisations (
  id text primary key,                         -- org_…
  name text not null,
  plan text not null default 'free',           -- free|pro|team|enterprise
  data_region text not null default 'primary', -- residency pin
  settings jsonb not null default '{}',        -- numeral system, calendar, gate τ, AI disclosure, retention
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
  created_at timestamptz default now(),
  primary key (artifact_id, version)
);
-- Append-only: revoke update/delete from app roles; restores create a new version.
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
  step_state jsonb not null default '{}',
  validation_status text not null default 'incomplete', -- incomplete|warnings|valid
  completed_at timestamptz
);
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
create table kb.source_documents (
  id text primary key, scope text not null check (scope in ('global','org')), org_id text,
  title text not null, publisher text, language text,
  licence jsonb not null,                       -- see 03 §2; enforced by retrieval layer
  status text not null, current_version_id text
);
create table kb.source_versions (
  id text primary key, source_document_id text references kb.source_documents(id),
  storage_key text not null, sha256 text not null, page_count int,
  ingested_at timestamptz, ingest_report jsonb
);

create table kb.frameworks (
  id text primary key, catalogue_no int unique, slug text unique not null,
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
  provenance text not null check (provenance in ('source_document','platform_authored','ai_drafted_reviewed','org_authored')),
  source_refs jsonb not null default '[]',      -- [{source_document_id, pages}]
  review jsonb, status text not null
);

create table kb.chunks (
  id text primary key,
  corpus text not null check (corpus in ('global_kb','org_kb','project_evidence')),
  org_id text, project_id text,                 -- null for global
  origin jsonb not null,                        -- 03 §2.1
  language text not null,
  text text not null, text_normalised text not null,
  locator jsonb not null default '{}',
  section_type text, framework_ids text[] default '{}', taxonomy_codes text[] default '{}',
  token_count int,
  embedding vector(1024),                       -- dim per embedding model; separate column/table per model on migration
  embedding_model text not null,
  fts tsvector generated always as (to_tsvector('simple', text_normalised)) stored,
  content_hash text not null,
  active boolean not null default true
);
create index chunks_hnsw on kb.chunks using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
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

## 4. Row-Level Security

```sql
alter table workspace.projects enable row level security;
create policy tenant_isolation on workspace.projects
  using (org_id = current_setting('app.org_id', true))
  with check (org_id = current_setting('app.org_id', true));
-- identical policy on every table carrying org_id; kb.chunks policy:
create policy kb_visibility on kb.chunks using (
  corpus = 'global_kb'
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
| Backups | PITR 14 days; daily snapshots 35 days, encrypted, same region | Restore drill quarterly |

**Right-to-erasure:** the `purge` job deletes user-owned rows across schemas, evidence objects, deliverables, chunks (`project_evidence`) and AI-run payloads, and writes an erasure certificate to the audit log. Backups age out within 35 days (documented in the DPA).

## 6. Scaling path

| Trigger | Action |
|---|---|
| > 5k QPS reads | Read replicas for list/search endpoints |
| `kb.chunks` > 20M rows or vector p95 > 150 ms | Partition `chunks` by corpus/org hash; consider dedicated vector service |
| `ai_runs` growth | Monthly range partitions; move > 90-day partitions to cheaper storage |
| Enterprise single-tenant | Same migrations against a dedicated cluster; RLS still on |
