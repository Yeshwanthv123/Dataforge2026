# Verification record

Verified 8 September 2026 on Windows with Docker Desktop 4.46.0 / Linux Docker Engine 28.4.0.

## Actual container build and startup

`docker compose up --build -d` successfully pulled base images, installed packages, trained the NumPy decoder, built the TypeScript/React frontend, created the SQLite volume, and started both services. `docker compose up -d --wait` confirmed both health checks.

## Tests

`docker compose exec -T backend python -m pytest -q`: **11 passed** inside the built Linux image.

Coverage: all eight clean cues; collision and delta recovery; interference from similar cues; zero-write no-signal behavior; retention erasure; seeded reproducibility and unchanged trained weights; exact unit-key delta correction; public API/input validation; password hashing and session cookies; login/logout; experiment save/list/read/delete; cross-user ownership checks; progress persistence; duplicate registration; expired sessions; foreign-origin rejection; authentication rate limits.

The test run emitted upstream Starlette/AnyIO deprecation and pytest cache-permission warnings. They do not affect serving the app. The tests use an isolated temporary database, never the user notebook database.

## Full-stack restart test

`scripts/compose_smoke.py prepare` sent requests through http://localhost:8080, including Nginx static serving, API health, account creation, live delta inference, saving a result and saving progress.

After `docker compose restart backend` and a healthy wait, `scripts/compose_smoke.py verify` checked that the session, account, progress and saved result persisted. It then verified deletion, logout, unauthorized access after logout, and login again. Both phases passed. The test removes its experiment and revokes sessions; its generated QA account/progress remain in the local demo volume. No shared default user is baked into the images.

To reproduce with the local development environment installed:

```powershell
.\.venv\Scripts\python.exe scripts/compose_smoke.py prepare
docker compose restart backend
docker compose up -d --wait
.\.venv\Scripts\python.exe scripts/compose_smoke.py verify
```

The scratch file `tmp/compose-smoke.json` contains only generated QA credentials and is ignored by Git. Do not publish it.

## Frontend

- Strict TypeScript build and Vite production bundle: passed locally and inside Docker.
- `npm audit`: zero reported vulnerabilities at verification time, including development dependencies.
- Browser checks: guest access; preset selection; live collision mismatch; switching to delta; registration; saving a result; notebook listing/reopening; lesson answer/progress; model metrics page; actual Nginx-served app load.
- Desktop and narrower desktop layouts were visually inspected. Mobile styles are implemented; the browser tool did not honor the requested 390px viewport, so a true mobile viewport is not claimed as visually verified.
- Reduced-motion CSS and keyboard/focus semantics are implemented. No formal assistive-technology audit or learner study is claimed.

## Supporting documents

The one-page concept summary and three-page technical blog were rendered and visually reviewed. Layout is clean, sources are linked, and full-model research evidence is distinguished from prototype measurements.

## Host issue resolved

Docker Desktop initially failed on a stale `dockerInference` socket in its runtime directory. The runtime directory was moved to `C:/Users/PC/AppData/Local/Docker/run.trace-backup-20260908`, and Docker created fresh sockets. Original settings were restored from `C:/Users/PC/AppData/Roaming/Docker/settings-store.trace-backup-20260908.json`. Docker then started successfully. Existing Docker data volumes/images were not reset or deleted.

## Boundaries

No public deployment, public repository, hackathon submission, recorded demo or guarantee of a prize is represented by these checks. The model is a synthetic educational model, not a full BDH implementation. First builds require registry access. Host platform/version changes can require fresh verification.
# Submission release checks — 10 September 2026

- `docker compose up --build -d`: successful Linux frontend/backend build and startup, including the TypeScript production build.
- `docker compose run --rm backend python -m pytest -q`: **11 passed**. Warnings: a transitive Starlette/AnyIO deprecation and pytest cache writes denied by the non-root container. These did not affect test results.
- `scripts/reproduce_claim.py`: Hebbian recalls Amber; delta recalls Violet; both retain 72 cells / 576 state bytes.
- `node scripts/verify_public_model.mjs .venv/Scripts/python.exe`: **12 configurations, 10,392 numeric values, maximum difference 0** between local Python and Pyodide. `elapsed_ms` excluded. See PARITY_CHECK.json. This is implementation parity, not scientific performance validation.
- Public-mode UI locally: fresh runtime load, real collision, delta correction, save, page reload and notebook reopen passed without sign-in.
- Concept summary: **one page, 668 extracted words**. Technical blog: three pages. All PDF pages rendered and visually reviewed.
- Pitch: seven slides, package/geometry validation passed, all slides rendered and reviewed. Unused embedded font binaries removed; slide XML content preserved. Not tested in native Microsoft PowerPoint.
- The full-stack smoke check covers registration, API computation, SQLite save and progress; repeat it with scripts/compose_smoke.py as described below when changing persistence code.

No formal usability study, production reliability study or full BDH/CQ replication is claimed. Public deployment verification is recorded separately in RELEASE_VERIFICATION.json when the release is published.

## Reproduce these checks

```sh
docker compose up --build -d
docker compose run --rm backend python -m pytest -q -p no:cacheprovider
```

With backend requirements installed in your local virtual environment:

```sh
python scripts/reproduce_claim.py
python scripts/compose_smoke.py prepare
docker compose restart backend
python scripts/compose_smoke.py verify
```

Wait for the backend health check after restarting. The smoke check creates one disposable local QA account and keeps temporary credentials only under ignored tmp/. Do not publish that folder.

After building the public edition: `node scripts/verify_public_model.mjs path/to/your/python`. The second argument must be a Python interpreter with backend requirements installed.

## Earlier development record
