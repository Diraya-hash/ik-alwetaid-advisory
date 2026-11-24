# 18: Phase 0 Operational Readiness (eval v1)

> Status 2026-11-24: **everything that does not need your credentials, permissions or approval is done.** Verdict: **NO-GO** (unchanged) until the evaluation has run and the human and PowerPoint evidence is collected and reviewed. No paid API call or workflow has been started. Frozen evaluation components and the eval-v1 reporting lock are unchanged.

## 1. Inspection findings (2026-11-24)

| # | Finding | Effect | Resolution | Owner |
|---|---|---|---|---|
| F1 | `main` (default branch) has no `.github/` folder; GitHub lists **0 workflows** | The evaluation cannot be started from the Actions page | Merge the Phase 0 branch into `main` through a PR (§3, A3) | **You** (approval) |
| F2 | Environment `phase0-eval` and its secret cannot be inspected or created without repository admin rights | The run cannot get the key | Create the environment and secret (§3, A2) | **You** |
| F3 | Without a key, the workflow silently fell back to a dry run | A misconfigured environment would look like a "successful" run | **Fixed:** a preflight step stops the job before any other step if the secret is missing (no dry run, no cost) | Done |
| F4 | Timeout was 150 min; the approved 3-run configuration needs an estimated 2–3 h | A run could be killed partway | **Fixed:** timeout 330 min (hosted-runner maximum is 360) | Done |
| F5 | The results commit used one `git add` for all paths; one missing file made it add nothing, silently | Measurements could be lost | **Fixed:** only existing files are added; tested locally with partial outputs and with no outputs | Done |
| F6 | If an experiment stopped (e.g. spending cap), the report, scan and commit steps were skipped | Partial measurements lost | **Fixed:** report, results scan and commit run on failure too; the commit is marked `status=INCOMPLETE`; nothing is committed unless the results secret scan passes | Done |
| F7 | Defaults were runs = 2 and one $15 cap for every experiment | Did not match the approved configuration (runs = 3; cap $30 for A) | **Fixed:** defaults runs = 3, A cap $30, B / C / S7 judge $10 each; **hard ceiling $60 per dispatch** | Done |
| F8 | The repository is **public** | Results branches (model outputs and AI-judge verdicts) will be publicly readable; an evaluator could look at them before submitting | Decision D1 (§3, A5). Technical control added: `phase0/human-eval/` is git-ignored, so a round folder can never be committed | **You** (decision) |
| F9 | Public repository: required reviewers on environments are available on every GitHub plan | — | No action | — |
| F10 | `main` deploys to Vercel (the LNA simulator). The Phase 0 merge adds only `docs/`, `phase0/`, `.github/`, `.githooks/` and `.gitignore`; the Vercel build (`ik-lna-simulator`) is unchanged | One redeploy of the unchanged simulator | No action | — |
| F11 | Evaluator, adjudicator and PowerPoint testers not named | Human calibration and PowerPoint prerequisites cannot start | Templates ready (§4) | **You** (names) |

**Rehearsal (2026-11-24, throwaway copy, no key, no cost):**
- install, repository secret scan and integrity check all pass;
- experiments A, B and C build every request for the 40 held-out scenarios with runs = 3, and write no results;
- the S7 judge refuses without an experiment-A run;
- the evidence report returns **NO-GO**;
- preflight without a key stops the job (exit 1);
- the results commit with partial outputs succeeds to a local test remote, labelled `INCOMPLETE`;
- with no outputs, the commit step exits cleanly.

## 2. Execution configuration (approved, now the workflow defaults)

| Input | Value | Note |
|---|---|---|
| experiments | `all` | A, B, C, then the S7 judge, then cost/latency |
| set | `heldout` | Sealed; integrity verified before the run |
| effort | `high` | |
| runs | `3` | Up to 15 eligible S7 outputs per language |
| max_usd | `30` | Cap for experiment A; B, C and the S7 judge are $10 each (ceiling $60) |

**Cost estimate (not measured):** about US$18–45 for the whole dispatch (list prices in the frozen config; output lengths assumed). The hard ceiling is $60.

**Time:** about 2–3 hours, plus your approval click.

## 3. Your actions (in this order)

### A1. Anthropic API key (about 5 minutes)
1. Open the Anthropic Console: <https://console.anthropic.com/>
2. **Settings → Workspaces → Create workspace**, named `bps-phase0-eval`. Set a **monthly spend limit of US$75** (above the $60 ceiling, so the workflow's own caps stop first).
3. In that workspace: **API keys → Create key**, named `bps-phase0-eval-202611`. Copy it. It goes **only** into GitHub in A2: never into chat, files, email or notes.

### A2. GitHub environment and secret (about 5 minutes)
1. Open <https://github.com/Diraya-hash/ik-alwetaid-advisory/settings/environments/new>
2. Name: `phase0-eval` (exactly) → **Configure environment**.
3. **Required reviewers:** tick it and add yourself. Leave **"Prevent self-review" unticked**, otherwise you cannot approve your own run.
4. **Deployment branches and tags:** choose **Selected branches and tags → Add deployment branch or tag rule →** `main`.
5. **Environment secrets → Add environment secret:** name `ANTHROPIC_API_KEY`, value = the key from A1 → **Add secret**.
6. Do **not** add the key as a repository secret or a variable.

### A3. Approve and merge the Phase 0 branch into `main` (about 3 minutes)
1. Open <https://github.com/Diraya-hash/ik-alwetaid-advisory/compare/main...claude/laughing-dirac-cx72w0?expand=1>
2. Title: `Phase 0: evaluation harness, eval-v1 locks, docs and protected evaluation workflow`. Then **Create pull request**. (Or ask Claude to open the PR for you.)
3. Review it, then **Merge pull request → Confirm merge**.
4. Check: <https://github.com/Diraya-hash/ik-alwetaid-advisory/actions/workflows/phase0-eval.yml> now shows **phase0-eval** with a **Run workflow** button. If the Actions tab shows no workflows, open <https://github.com/Diraya-hash/ik-alwetaid-advisory/settings/actions> and allow actions (GitHub-owned actions are enough).

### A4. Name the people (about 10 minutes)
- Fill `templates/evaluator-assignment.md`: evaluator, adjudicator, coordinator (three different people).
- Fill `templates/pptx-tester-assignment.md`: a Windows tester and a Mac tester.
- Keep signed copies outside the repository. **The PowerPoint test can start immediately**; it does not depend on the API run.

### A5. Decision D1: blinding in a public repository
After the run, the results branch (including AI-judge verdicts) is publicly readable.

| Option | What it means | Your effort |
|---|---|---|
| **D1-a (recommended)** Keep public; procedural blinding | The evaluator signs the declaration (no access to the repository until submission); round folders are git-ignored; the coordinator sends only `evaluator/` | None beyond A4 |
| D1-b Make the repository private before the run | Technical blinding of results. Required reviewers on a private repository need GitHub Pro (personal accounts); check that Vercel still has access | Settings → General → Danger zone → Change visibility; plan upgrade if needed |

### A6. Authorise the evaluation run (about 2 minutes, then about 2–3 hours of waiting)
1. Open <https://github.com/Diraya-hash/ik-alwetaid-advisory/actions/workflows/phase0-eval.yml> → **Run workflow** → branch `main` → keep the defaults (§2) → **Run workflow**.
2. The job waits for approval. Open the run → **Review deployments** → tick `phase0-eval` → **Approve and deploy**. This approval is your explicit authorisation; the key is released to the job only after it.
3. When it finishes, results are on branch `phase0-eval-results/run-<id>`. Tell Claude the run ID.

## 4. After the run (Claude can do these in a session; no extra action from you)

| Step | Who | Output |
|---|---|---|
| Fetch the results branch and verify the manifests, seals and config hash | Claude | Integrity confirmation |
| Prepare the blinded round: `human-eval prepare --a … --aij … --b …` | Claude (as coordinator support) | `evaluator/` folder sent to you as a file, for the evaluator; `coordinator/` kept private |
| Evaluator rates the packets | Evaluator | `responses.csv` |
| `submit`, `compare`, adjudication, `summarise` | Coordinator / Claude, then the adjudicator | Calibration report, disagreement log |
| Summarise the PowerPoint workbook | Claude | `manual-summary.json` |
| Consolidated GO/NO-GO report | Claude, then your review and sign-off | Doc 13 update and the evidence report |

## 5. Consolidated final readiness checklist

| # | Item | Status | Owner |
|---|---|---|---|
| 1 | Scoring configuration frozen (eval v1, `945f2b7b…`) | ✅ | — |
| 2 | Reporting layer locked (`5a92509c…`); every lock recorded in history | ✅ | — |
| 3 | Sealed sets intact (4 of 4) | ✅ | — |
| 4 | Thresholds S1–S7 and the A/B/C/F gates approved and documented with numerators and denominators | ✅ | — |
| 5 | Secret scan clean: repository and full history | ✅ | — |
| 6 | Workflow hardened (preflight, timeout, robust commit, partial-run handling, approved defaults, $60 ceiling) and rehearsed without cost | ✅ | — |
| 7 | Human-evaluation round folders cannot be committed (`human-eval/` ignored) | ✅ | — |
| 8 | Evaluator and tester assignment templates | ✅ | — |
| 9 | Dedicated Anthropic workspace with a spend limit, and a key | ⛔ | You (A1) |
| 10 | Environment `phase0-eval`: required reviewer, `main`-only, secret set | ⛔ | You (A2) |
| 11 | Phase 0 merged to `main`; workflow visible in Actions | ⛔ | You (A3) |
| 12 | Evaluator, adjudicator and coordinator named and declarations signed | ⛔ | You (A4) |
| 13 | PowerPoint testers named; Windows and Mac machines available | ⛔ | You (A4) |
| 14 | Decision D1 on public-repository blinding | ⛔ | You (A5) |
| 15 | Evaluation run authorised and completed | ⛔ | You (A6) |
| 16 | Blinded human calibration completed and adjudicated (both languages, including S7) | ⛔ | Evaluator, adjudicator |
| 17 | PowerPoint workbook complete; exit criteria recomputed | ⛔ | Testers, then Claude |
| 18 | Consolidated GO/NO-GO report reviewed and signed off | ⛔ | Claude, then you |

**Verdict: NO-GO** until items 9–18 are complete and the report is reviewed. No product implementation.
