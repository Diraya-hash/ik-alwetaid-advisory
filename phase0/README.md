# Phase 0 prototypes (isolated)

Experiments for docs/business-solver/10–13. **Not production code.** Nothing here is imported by any app; it has its own
`package.json` and `node_modules` and is excluded from the product build.

| Experiment | Command | Needs API key |
|---|---|---|
| A, deterministic (oracle) | `node experiments/a-oracle-recommender.mjs --ngf=v0.2|v0.3|v0.3b` | No |
| A, robustness | `node experiments/a-perturbation.mjs --variant=v0.2|v0.3|v0.3b` | No |
| A, B, C with the model | `node experiments/llm-suite.mjs a|b|c --runs=2 --effort=high` (add `--dry-run` to build requests only) | **Yes** (`ANTHROPIC_API_KEY`) |
| C, deterministic (L1) | `node experiments/c-critic-l1.mjs` | No |
| D, BPMN | `node experiments/d-bpmn/run.mjs [--fixed-columns]` | No (uses preinstalled Chromium) |
| E, PowerPoint | `python3 experiments/e-pptx/build_pptx.py && python3 experiments/e-pptx/validate_pptx.py` | No (python-pptx, LibreOffice, uharfbuzz) |
| F, cost & latency | `node experiments/f-cost-latency.mjs` (after the model runs) | Needs model runs |
| Held-out run (sealed set, frozen config) | `node experiments/llm-suite.mjs a|b|c --set=heldout --effort=high --runs=2 --max-usd=15` | **Yes** |
| Freeze config / seal a set | `node scripts/freeze-config.mjs "<reason>"` · `node scripts/seal-set.mjs <set.json> "<provenance>"` | No |
| Secret scan | `bash scripts/check-no-secrets.sh [--staged|--history|<dir>]` | No |
| PowerPoint validation pack | `python3 experiments/e-pptx/build_validation_pack.py` (protocol: doc 16) | No |
| PowerPoint results workbook | `python3 experiments/e-pptx/make_results_template.py` (refuses to overwrite) | No |
| Human evaluation (doc 17) | `node scripts/human-eval.mjs prepare|submit|compare …` | No (needs model results) |
| Integrity check | `node scripts/verify-integrity.mjs` | No |

**API key:** never in files, logs or chat. Use the reviewer-gated GitHub environment secret and the `phase0-eval` workflow (doc 14 §4). The held-out set must not be read for tuning. The suite refuses to score it if the frozen configuration or the seal changed.

Setup: `npm install`; `pip install python-pptx fonttools brotli uharfbuzz`. The Arabic font for LibreOffice rendering is
converted from `@fontsource/ibm-plex-sans-arabic` into `~/.fonts` (see doc 12 §E). Results land in `results/`.
