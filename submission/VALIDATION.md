# Submission release checks — 10 September 2026

- `docker compose up --build -d`: successful Linux frontend/backend build and startup, including the TypeScript production build.
- `docker compose run --rm backend python -m pytest -q`: **11 passed**. Warnings: a transitive Starlette/AnyIO deprecation and pytest cache writes denied by the non-root container. These did not affect test results.
- `scripts/reproduce_claim.py`: Hebbian recalls Amber; delta recalls Violet; both retain 72 cells / 576 state bytes.
- `node scripts/verify_public_model.mjs .venv/Scripts/python.exe`: **12 configurations, 10,392 numeric values, maximum difference 0** between local Python and Pyodide. `elapsed_ms` excluded. See PARITY_CHECK.json. This is implementation parity, not scientific performance validation.
- Public-mode UI locally: fresh runtime load, real collision, delta correction, save, page reload and notebook reopen passed without sign-in.
- Concept summary: **one page, 668 extracted words**. Technical blog: three pages. All PDF pages rendered and visually reviewed.
- Pitch: seven slides, package/geometry validation passed, all slides rendered and reviewed. Unused embedded font binaries removed; slide XML content preserved. Not tested in native Microsoft PowerPoint.
- Full-stack smoke check passed after restart: persisted accounts, sessions, progress and saved results; deletion, logout and login also passed.

No formal usability study, production reliability study or full BDH/CQ replication is claimed. The published GitHub Pages app computed the collision and delta correction live. Anonymous file checks and public repository visibility are recorded in RELEASE_VERIFICATION.json in the source repository.

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


