# Public and local execution

Public URL: https://yeshwanthv123.github.io/Dataforge2026/

## Public edition

GitHub Pages serves a static React build and a pinned Pyodide 0.27.7 distribution. A dedicated worker loads NumPy and Pydantic and executes the unchanged backend/app/model.py with the included decoder.npz. Model weights are SHA-256 checked at startup. No sign-in, paid inference endpoint or externally hosted FastAPI service is needed. All runtime files are served from the same origin; first load requires downloading the runtime. A modern browser with WebAssembly and Web Workers is required.

Inputs are computed on-device. Notebook entries and lesson progress use localStorage, stay in that browser profile and disappear if site data is cleared. Private browsing or storage quotas can prevent saving; the app reports storage errors. This public edition is not a shared SQL service. The Docker edition provides FastAPI, SQLite and authenticated persistence.

The public numerical stack is Python 3.12.7, NumPy 2.0.2 and Pydantic 2.10.5. Docker dependencies are pinned separately in backend/requirements.txt. Both use the same memory source; floating-point behavior can depend on the numerical stack. Never interpret wall-clock timings as a hardware-normalized benchmark.

## Rebuild the public artifact

Prerequisites: Python 3.12+, Node 22.19+ and npm, Internet for dependency installation. At the project root:

```sh
npm --prefix frontend ci
python scripts/build_public.py
python scripts/serve_public.py
```

Open http://localhost:8090/Dataforge2026/. The build verifies hashes from docs/PUBLIC_RUNTIME_LOCK.json. Missing runtime files download into .runtime-cache/; hash mismatches stop the build. Updating that lock intentionally uses `python scripts/build_public.py --initialize-runtime-lock`; review the resulting dependency changes before release.

In the submission ZIP, serve the already-built public-artifact folder with `python scripts/serve_public.py --directory public-artifact`; no npm build or download is needed. Use HTTP, not file://, so workers can load correctly. The source repository stores source and lock files; its gh-pages branch contains the built site.

## Publish an update

Build and verify locally. Commit source changes to main. Copy the contents of .public-build/ into a clean checkout of gh-pages, preserving that branch's .git directory, then commit and push normally. GitHub Pages is configured to serve gh-pages at the root. Keep .nojekyll. Do not publish databases or development directories. The /Dataforge2026/ base path is configured in frontend/vite.config.ts.

## Full-stack local edition

Run `docker compose up --build`. Nginx on localhost:8080 proxies /api to FastAPI; API docs are localhost:8000/docs. SQLite lives in the trace-data named volume. README.md includes account setup, security behavior, ports, tests, retraining and development commands. No notebook kernel or Jupyter setup is necessary.
