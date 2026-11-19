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

Setup: `npm install`; `pip install python-pptx fonttools brotli uharfbuzz`. The Arabic font for LibreOffice rendering is
converted from `@fontsource/ibm-plex-sans-arabic` into `~/.fonts` (see doc 12 §E). Results land in `results/`.
